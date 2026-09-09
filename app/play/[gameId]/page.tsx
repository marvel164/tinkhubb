"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Clock3,
  Flame,
  X,
} from "lucide-react";

type AnswerOption = {
  key: "A" | "B" | "C" | "D";
  text: string;
};

type GameData = {
  gameId: string;
  status: string;
  completed: boolean;
  totalQuestions: number;
  currentQuestionNumber: number;
  questionTimeSeconds: number;
  questionStartedAt: string;
  expiresAt: string;
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  question: {
    id: string;
    questionNumber: number;
    text: string;
    options: AnswerOption[];
  };
};

type AnswerResponse = {
  result: "CORRECT" | "INCORRECT" | "TIMEOUT";
  pointsEarned: number;
  completed: boolean;
  gameId: string;
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  questionsAnswered: number;
  nextQuestionNumber: number | null;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
};

export default function GamePage() {
  const params = useParams<{ gameId: string }>();
  const router = useRouter();

  const gameId = params.gameId;

  const [game, setGame] = useState<GameData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const [selectedOption, setSelectedOption] =
    useState<"A" | "B" | "C" | "D" | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingNextQuestion, setLoadingNextQuestion] =
    useState(false);

  const [error, setError] = useState("");

  const [feedback, setFeedback] = useState<
    "CORRECT" | "INCORRECT" | "TIMEOUT" | null
  >(null);

  const [pointsEarned, setPointsEarned] = useState(0);

  /*
   * Prevents duplicate answer submissions.
   * This is especially important because timer expiry and
   * manual answer selection can happen very close together.
   */
  const submittedRef = useRef(false);

  /*
   * Prevents delayed callbacks from updating state after
   * navigation/unmount.
   */
  const mountedRef = useRef(true);

  /*
   * Keeps references to delayed transitions so they can
   * be cancelled when the component unmounts or another
   * transition starts.
   */
  const advanceTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * Abort the current GET request when the component
   * unmounts or a new game load starts.
   */
  const loadAbortRef =
    useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }

      loadAbortRef.current?.abort();
    };
  }, []);

  const loadGame = useCallback(
    async (showFullLoader = false) => {
      loadAbortRef.current?.abort();

      const controller = new AbortController();
      loadAbortRef.current = controller;

      try {
        if (showFullLoader) {
          setLoading(true);
        } else {
          setLoadingNextQuestion(true);
        }

        setError("");

        const response = await fetch(
          `/api/game/${gameId}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const data =
          (await response.json()) as ApiResponse<GameData>;

        if (!response.ok) {
          if (
            response.status === 401 ||
            response.status === 403
          ) {
            router.replace(
              `/login?returnTo=${encodeURIComponent(
                `/play/${gameId}`,
              )}`,
            );
            return;
          }

          throw new Error(
            data.message ||
              data.error ||
              "Unable to load the game.",
          );
        }

        if (!data.data) {
          throw new Error(
            "The game data was not returned.",
          );
        }

        if (data.data.completed) {
          router.replace(
            `/play/${gameId}/results`,
          );
          return;
        }

        if (!mountedRef.current) {
          return;
        }

        setGame(data.data);
        setSelectedOption(null);
        setFeedback(null);
        setPointsEarned(0);

        submittedRef.current = false;

        const expiresAt = new Date(
          data.data.expiresAt,
        ).getTime();

        if (Number.isNaN(expiresAt)) {
          throw new Error(
            "The game timer could not be initialized.",
          );
        }

        const remaining = Math.max(
          0,
          Math.ceil(
            (expiresAt - Date.now()) / 1000,
          ),
        );

        setTimeLeft(remaining);
      } catch (err) {
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          return;
        }

        if (!mountedRef.current) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the game. Please try again.",
        );
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setLoadingNextQuestion(false);
        }
      }
    },
    [gameId, router],
  );

  /*
   * Initial game load.
   */
  useEffect(() => {
    loadGame(true);
  }, [loadGame]);

  const submitAnswer = useCallback(
    async (
      answer: "A" | "B" | "C" | "D" | null,
    ) => {
      /*
       * The ref is the actual duplicate-submission lock.
       * State alone is not reliable enough because React
       * state updates are asynchronous.
       */
      if (submittedRef.current) {
        return;
      }

      submittedRef.current = true;
      setSubmitting(true);
      setError("");

      try {
        const response = await fetch(
          `/api/game/${gameId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-store",
            body: JSON.stringify({
              selectedOption: answer ?? "",
            }),
          },
        );

        const data =
          (await response.json()) as ApiResponse<AnswerResponse>;

        if (!response.ok) {
          /*
           * Authentication may expire while the player
           * is inside a game.
           */
          if (
            response.status === 401 ||
            response.status === 403
          ) {
            router.replace(
              `/login?returnTo=${encodeURIComponent(
                `/play/${gameId}`,
              )}`,
            );
            return;
          }

          throw new Error(
            data.message ||
              data.error ||
              "Unable to submit your answer.",
          );
        }

        if (!data.data) {
          throw new Error(
            "The answer result was not returned.",
          );
        }

        const result = data.data;

        if (!mountedRef.current) {
          return;
        }

        setFeedback(result.result);
        setSelectedOption(answer);
        setPointsEarned(result.pointsEarned);

        /*
         * Update the visible score immediately instead of
         * waiting for another GET request.
         */
        setGame((current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            score: result.score,
            correctAnswers: result.correctAnswers,
            incorrectAnswers: result.incorrectAnswers,
          };
        });

        /*
         * Final question.
         */
        if (result.completed) {
          advanceTimeoutRef.current =
            setTimeout(() => {
              if (!mountedRef.current) {
                return;
              }

              router.replace(
                `/play/${gameId}/results`,
              );
            }, 850);

          return;
        }

        /*
         * Move to the next question after showing feedback.
         */
        advanceTimeoutRef.current =
          setTimeout(() => {
            if (!mountedRef.current) {
              return;
            }

            loadGame(false);
          }, 700);
      } catch (err) {
        if (!mountedRef.current) {
          return;
        }

        /*
         * Allow the player to retry if submission genuinely
         * failed. The server itself also protects against
         * duplicate answers.
         */
        submittedRef.current = false;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to submit your answer. Please try again.",
        );

        setFeedback(null);
        setPointsEarned(0);
      } finally {
        if (mountedRef.current) {
          setSubmitting(false);
        }
      }
    },
    [gameId, loadGame, router],
  );

  /*
   * Timer.
   *
   * Important:
   * This interval does NOT depend on timeLeft.
   * The previous version recreated the interval every
   * time the countdown changed.
   */
  useEffect(() => {
    if (
      !game ||
      feedback ||
      submitting ||
      loadingNextQuestion ||
      submittedRef.current
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    game,
    feedback,
    submitting,
    loadingNextQuestion,
  ]);

  /*
   * When the timer reaches zero, submit TIMEOUT exactly once.
   */
  useEffect(() => {
    if (
      !game ||
      feedback ||
      submitting ||
      loadingNextQuestion ||
      submittedRef.current
    ) {
      return;
    }

    if (timeLeft === 0) {
      submitAnswer(null);
    }
  }, [
    timeLeft,
    game,
    feedback,
    submitting,
    loadingNextQuestion,
    submitAnswer,
  ]);

  function handleOptionSelect(
    option: "A" | "B" | "C" | "D",
  ) {
    if (
      submitting ||
      feedback ||
      loadingNextQuestion ||
      submittedRef.current ||
      !game
    ) {
      return;
    }

    setSelectedOption(option);
    submitAnswer(option);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf6] text-[#451900] dark:bg-[#17110e] dark:text-[#fff4ec]">
        <div className="px-5 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#ffe8d4] border-t-[#FF6B00] dark:border-[#49352c] dark:border-t-[#FF6B00]" />

          <p className="mt-4 text-[11px] font-semibold text-[#6f7278] dark:text-[#a99b93]">
            Loading your game...
          </p>
        </div>
      </main>
    );
  }

  if (error && !game) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf6] px-5 text-[#451900] dark:bg-[#17110e] dark:text-[#fff4ec]">
        <div className="w-full max-w-[460px] rounded-[16px] border border-[#eadfd6] bg-white p-8 text-center shadow-[0_12px_35px_rgba(69,25,0,0.06)] dark:border-[#49352c] dark:bg-[#241b17] dark:shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0e6] dark:bg-[#35251d]">
            <AlertCircle
              size={25}
              strokeWidth={1.8}
              className="text-[#FF6B00]"
            />
          </div>

          <h1 className="mt-5 text-[20px] font-extrabold">
            Unable to Load Game
          </h1>

          <p className="mt-2 text-[12px] leading-6 text-[#6f7278] dark:text-[#a99b93]">
            {error}
          </p>

          <button
            type="button"
            onClick={() => loadGame(true)}
            className="mt-6 rounded-[8px] bg-[#FF6B00] px-7 py-3 text-[11px] font-extrabold text-white transition hover:bg-[#e95f00] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!game) {
    return null;
  }

  const progress =
    game.totalQuestions > 0
      ? (game.currentQuestionNumber /
          game.totalQuestions) *
        100
      : 0;

  const formattedTime = `${Math.floor(
    timeLeft / 60,
  )
    .toString()
    .padStart(2, "0")}:${(timeLeft % 60)
    .toString()
    .padStart(2, "0")}`;

  const isUrgent = timeLeft <= 10;

  const timerProgress =
    game.questionTimeSeconds > 0
      ? Math.max(
          0,
          Math.min(
            100,
            (timeLeft /
              game.questionTimeSeconds) *
              100,
          ),
        )
      : 0;

  const timerDegrees =
    360 - timerProgress * 3.6;

  return (
    <main className="min-h-screen bg-[#fffaf6] text-[#451900] transition-colors duration-200 dark:bg-[#17110e] dark:text-[#fff4ec]">
      {/* GAME HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#f1e3da] bg-[#fffaf6]/95 backdrop-blur-md dark:border-[#342620] dark:bg-[#17110e]/95">
        <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between px-4 sm:px-7 lg:px-10">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="TinkHubb home"
            className="shrink-0 text-[21px] font-extrabold tracking-[-0.04em] text-[#FF6B00] sm:text-[23px]"
          >
            TinkHubb
          </button>

          <nav
            aria-label="Game navigation"
            className="hidden items-center gap-6 lg:flex"
          >
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-[12px] font-semibold text-[#6f625b] transition hover:text-[#FF6B00] dark:text-[#c9bcb5] dark:hover:text-[#FF6B00]"
            >
              HOME
            </button>

            <button
              type="button"
              onClick={() => router.push("/play")}
              className="text-[12px] font-semibold text-[#FF6B00]"
            >
              PLAY GAME
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/leaderboard")
              }
              className="text-[12px] font-semibold text-[#6f625b] transition hover:text-[#FF6B00] dark:text-[#c9bcb5] dark:hover:text-[#FF6B00]"
            >
              LEADERBOARD
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/how-it-works")
              }
              className="text-[12px] font-semibold text-[#6f625b] transition hover:text-[#FF6B00] dark:text-[#c9bcb5] dark:hover:text-[#FF6B00]"
            >
              HOW IT WORKS
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <div
              aria-label="Player avatar"
              className="hidden h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#eadfd6] bg-[#ffe8d4] text-[10px] font-black text-[#FF6B00] dark:border-[#49352c] dark:bg-[#35251d] sm:flex"
            >
              TH
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-[#fff0e6] px-3 py-2 dark:bg-[#35251d]">
              <Flame
                size={14}
                fill="#FF6B00"
                className="text-[#FF6B00]"
              />

              <span className="hidden text-[10px] font-bold text-[#451900] dark:text-[#fff4ec] sm:inline">
                Streak
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* GAME AREA */}
      <section className="mx-auto w-full max-w-[900px] px-4 pb-16 pt-7 sm:px-6 sm:pb-20 sm:pt-10">
        {/* TOP META */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b776c] dark:text-[#9e8c83]">
              QUESTION
            </p>

            <p className="mt-1 text-[18px] font-black tracking-[-0.04em] text-[#451900] dark:text-[#fff4ec]">
              {game.currentQuestionNumber}
              <span className="mx-1 text-[#b9aaa2]">
                /
              </span>
              {game.totalQuestions}
            </p>
          </div>

          {/* TIMER */}
          <div
            className={`relative flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-full border-[4px] ${
              isUrgent
                ? "border-red-400 bg-red-50 text-red-600 dark:border-red-600 dark:bg-red-950/30 dark:text-red-300"
                : "border-[#FF6B00] bg-white text-[#451900] dark:bg-[#241b17] dark:text-[#fff4ec]"
            }`}
            aria-label={`${formattedTime} remaining`}
          >
            <div
              className="absolute inset-[-4px] rounded-full border-[4px] border-transparent border-t-[#FF6B00] transition-transform duration-500"
              style={{
                transform: `rotate(${timerDegrees}deg)`,
              }}
            />

            <div className="relative text-center">
              <Clock3
                size={12}
                className="mx-auto mb-0.5"
                strokeWidth={2}
              />

              <span className="text-[10px] font-black tabular-nums">
                {formattedTime}
              </span>
            </div>
          </div>
        </div>

        {/* SESSION PROGRESS */}
        <div className="mb-7">
          <div className="mb-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.08em] text-[#8b776c] dark:text-[#9e8c83]">
            <span>
              Question{" "}
              {game.currentQuestionNumber}
            </span>

            <span>
              {Math.round(progress)}% complete
            </span>
          </div>

          <div className="h-[4px] overflow-hidden rounded-full bg-[#ffe8d4] dark:bg-[#35251d]">
            <div
              className="h-full rounded-full bg-[#FF6B00] transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* QUESTION CARD */}
        <div className="relative rounded-[16px] border border-[#eadfd6] bg-white px-5 py-8 shadow-[0_12px_35px_rgba(69,25,0,0.055)] dark:border-[#49352c] dark:bg-[#241b17] dark:shadow-[0_12px_35px_rgba(0,0,0,0.18)] sm:px-9 sm:py-10 md:px-12">
          {loadingNextQuestion && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[16px] bg-white/80 backdrop-blur-[2px] dark:bg-[#241b17]/80">
              <div className="text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#ffe8d4] border-t-[#FF6B00] dark:border-[#49352c] dark:border-t-[#FF6B00]" />

                <p className="mt-3 text-[10px] font-bold text-[#6f7278] dark:text-[#a99b93]">
                  Next question...
                </p>
              </div>
            </div>
          )}

          <div className="text-center">
            <span className="inline-flex rounded-full bg-[#fff4e8] px-3 py-1.5 text-[8px] font-extrabold uppercase tracking-[0.1em] text-[#d97722] dark:bg-[#35251d] dark:text-[#ffad78]">
              Question{" "}
              {game.currentQuestionNumber}
            </span>

            <h1 className="mx-auto mt-5 max-w-[680px] text-[20px] font-extrabold leading-[1.45] tracking-[-0.025em] text-[#451900] dark:text-[#fff4ec] sm:text-[25px]">
              {game.question.text}
            </h1>
          </div>

          {/* ANSWERS */}
          <div className="mt-9 grid gap-3 sm:grid-cols-2">
            {game.question.options.map(
              (option) => {
                const isSelected =
                  selectedOption ===
                  option.key;

                let optionClass =
                  "border-[#eadfd6] bg-white hover:border-[#FF6B00] hover:bg-[#fffaf6] dark:border-[#49352c] dark:bg-[#241b17] dark:hover:border-[#FF6B00] dark:hover:bg-[#2a1e19]";

                let letterClass =
                  "border-[#eadfd6] bg-[#fffaf6] text-[#6f7278] dark:border-[#49352c] dark:bg-[#30241f] dark:text-[#b9aaa2]";

                let textClass =
                  "text-[#451900] dark:text-[#fff4ec]";

                if (
                  isSelected &&
                  feedback === "CORRECT"
                ) {
                  optionClass =
                    "border-green-400 bg-green-50 dark:border-green-700 dark:bg-green-950/25";

                  letterClass =
                    "border-green-500 bg-green-500 text-white";

                  textClass =
                    "text-green-800 dark:text-green-200";
                } else if (
                  isSelected &&
                  feedback === "INCORRECT"
                ) {
                  optionClass =
                    "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/25";

                  letterClass =
                    "border-red-500 bg-red-500 text-white";

                  textClass =
                    "text-red-800 dark:text-red-200";
                } else if (
                  isSelected &&
                  feedback === "TIMEOUT"
                ) {
                  optionClass =
                    "border-[#e5d7ce] bg-[#faf7f4] dark:border-[#49352c] dark:bg-[#30241f]";
                } else if (isSelected) {
                  optionClass =
                    "border-[#FF6B00] bg-[#FF6B00] shadow-[0_8px_24px_rgba(255,107,0,0.16)]";

                  letterClass =
                    "border-white/40 bg-white text-[#FF6B00]";

                  textClass = "text-white";
                }

                return (
                  <button
                    key={option.key}
                    type="button"
                    disabled={
                      submitting ||
                      !!feedback ||
                      loadingNextQuestion
                    }
                    onClick={() =>
                      handleOptionSelect(
                        option.key,
                      )
                    }
                    aria-pressed={isSelected}
                    className={`group flex min-h-[68px] w-full items-center gap-3 rounded-[10px] border px-3.5 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/25 disabled:cursor-not-allowed sm:min-h-[74px] sm:px-4 ${optionClass}`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[10px] font-extrabold transition sm:h-10 sm:w-10 ${letterClass}`}
                    >
                      {feedback ===
                        "CORRECT" &&
                      isSelected ? (
                        <Check size={15} />
                      ) : feedback ===
                          "INCORRECT" &&
                        isSelected ? (
                        <X size={15} />
                      ) : (
                        option.key
                      )}
                    </span>

                    <span
                      className={`text-[11px] font-semibold leading-5 transition-colors sm:text-[12px] ${textClass}`}
                    >
                      {option.text}
                    </span>
                  </button>
                );
              },
            )}
          </div>

          {/* FEEDBACK */}
          {feedback && (
            <div
              className={`mt-6 rounded-[10px] px-4 py-3.5 text-center ${
                feedback ===
                "CORRECT"
                  ? "bg-green-50 text-green-700 dark:bg-green-950/25 dark:text-green-300"
                  : feedback ===
                      "INCORRECT"
                    ? "bg-red-50 text-red-700 dark:bg-red-950/25 dark:text-red-300"
                    : "bg-[#fff9dc] text-[#7d7040] dark:bg-[#332b17] dark:text-[#cbbd83]"
              }`}
            >
              <p className="text-[11px] font-extrabold">
                {feedback ===
                "CORRECT"
                  ? `Correct! +${pointsEarned} ${
                      pointsEarned === 1
                        ? "point"
                        : "points"
                    }`
                  : feedback ===
                      "INCORRECT"
                    ? "Incorrect. Moving to the next question..."
                    : "Time's up. Moving to the next question..."}
              </p>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div
              role="alert"
              className="mt-5 rounded-[9px] border border-red-200 bg-red-50 px-4 py-3 text-[10px] leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
            >
              {error}
            </div>
          )}
        </div>

        {/* SCORE STRIP */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[9px] font-semibold text-[#8b817b] dark:text-[#9e8c83] sm:text-[10px]">
          <span>
            Score:{" "}
            <strong className="text-[#451900] dark:text-[#fff4ec]">
              {game.score}
            </strong>
          </span>

          <span
            aria-hidden="true"
            className="text-[#c7b8af]"
          >
            •
          </span>

          <span>
            Correct:{" "}
            <strong className="text-[#451900] dark:text-[#fff4ec]">
              {game.correctAnswers}
            </strong>
          </span>

          <span
            aria-hidden="true"
            className="text-[#c7b8af]"
          >
            •
          </span>

          <span>
            Incorrect:{" "}
            <strong className="text-[#451900] dark:text-[#fff4ec]">
              {game.incorrectAnswers}
            </strong>
          </span>
        </div>
      </section>
    </main>
  );
}
