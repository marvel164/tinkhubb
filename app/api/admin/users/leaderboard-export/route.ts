import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin/session";

function formatGeneratedDate() {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());
}

function formatNumber(value: number) {
  return value.toLocaleString("en-NG");
}

export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          message: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const users = await prisma.user.findMany({
      where: {
        status: {
          not: "DELETED",
        },
      },
      orderBy: [
        {
          totalPoints: "desc",
        },
        {
          currentStreak: "desc",
        },
        {
          username: "asc",
        },
      ],
      select: {
        username: true,
        totalPoints: true,
        currentStreak: true,
      },
    });

    const pdfDoc = await PDFDocument.create();

    pdfDoc.setTitle("TinkHubb Leaderboard");
    pdfDoc.setAuthor("TinkHubb Admin");
    pdfDoc.setSubject("TinkHubb Trivia leaderboard export");
    pdfDoc.setCreator("TinkHubb");
    pdfDoc.setProducer("TinkHubb");

    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595.28;
    const pageHeight = 841.89;

    const orange = rgb(1, 0.4196, 0);

    const dark = rgb(0.0706, 0.0706, 0.0706);

    const gray = rgb(0.4353, 0.4471, 0.4706);

    const lightGray = rgb(0.94, 0.94, 0.94);

    const veryLightGray = rgb(0.975, 0.975, 0.975);

    const white = rgb(1, 1, 1);

    const leftMargin = 42;
    const rightMargin = 42;

    const tableWidth = pageWidth - leftMargin - rightMargin;

    const columns = {
      rank: {
        x: leftMargin,
        width: 55,
      },

      username: {
        x: leftMargin + 55,
        width: 250,
      },

      points: {
        x: leftMargin + 305,
        width: 105,
      },

      streak: {
        x: leftMargin + 410,
        width: 101,
      },
    };

    const rowHeight = 30;
    const headerHeight = 34;

    const contentTop = pageHeight - 190;
    const footerY = 35;

    const rowsPerPage = 19;

    let pageNumber = 0;

    /*
     * Empty leaderboard is handled separately.
     */
    if (users.length === 0) {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      page.drawText("TinkHubb", {
        x: leftMargin,
        y: pageHeight - 58,
        size: 23,
        font: boldFont,
        color: orange,
      });

      page.drawText("Leaderboard Export", {
        x: leftMargin,
        y: pageHeight - 100,
        size: 22,
        font: boldFont,
        color: dark,
      });

      page.drawText("No players are currently available for the leaderboard.", {
        x: leftMargin,
        y: pageHeight - 135,
        size: 10,
        font: regularFont,
        color: gray,
      });
    } else {
      /*
       * Create one page at a time.
       */
      for (let start = 0; start < users.length; start += rowsPerPage) {
        pageNumber += 1;

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        const pageUsers = users.slice(start, start + rowsPerPage);

        /*
         * HEADER
         */

        page.drawText("TinkHubb", {
          x: leftMargin,
          y: pageHeight - 58,
          size: 23,
          font: boldFont,
          color: orange,
        });

        page.drawText("ADMIN", {
          x: leftMargin + 91,
          y: pageHeight - 56,
          size: 8,
          font: boldFont,
          color: gray,
        });

        page.drawText("Leaderboard Export", {
          x: leftMargin,
          y: pageHeight - 91,
          size: 22,
          font: boldFont,
          color: dark,
        });

        page.drawText("Current TinkHubb trivia leaderboard", {
          x: leftMargin,
          y: pageHeight - 111,
          size: 9.5,
          font: regularFont,
          color: gray,
        });

        page.drawText(`Generated ${formatGeneratedDate()}`, {
          x: leftMargin,
          y: pageHeight - 132,
          size: 8.5,
          font: regularFont,
          color: gray,
        });

        /*
         * PLAYER COUNT
         */

        page.drawRectangle({
          x: pageWidth - 145,
          y: pageHeight - 141,
          width: 103,
          height: 30,
          color: veryLightGray,
          borderColor: lightGray,
          borderWidth: 0.7,
        });

        page.drawText(`${formatNumber(users.length)} Players`, {
          x: pageWidth - 134,
          y: pageHeight - 129,
          size: 9,
          font: boldFont,
          color: dark,
        });

        /*
         * ORANGE DIVIDER
         */

        page.drawLine({
          start: {
            x: leftMargin,
            y: pageHeight - 151,
          },

          end: {
            x: pageWidth - rightMargin,
            y: pageHeight - 151,
          },

          thickness: 1.2,
          color: orange,
        });

        /*
         * TABLE HEADER
         */

        let currentY = contentTop;

        page.drawRectangle({
          x: leftMargin,
          y: currentY - headerHeight,
          width: tableWidth,
          height: headerHeight,
          color: dark,
        });

        const headerTextY = currentY - 22;

        page.drawText("RANK", {
          x: columns.rank.x + 9,
          y: headerTextY,
          size: 8,
          font: boldFont,
          color: white,
        });

        page.drawText("USERNAME", {
          x: columns.username.x + 9,
          y: headerTextY,
          size: 8,
          font: boldFont,
          color: white,
        });

        page.drawText("TOTAL POINTS", {
          x: columns.points.x + 9,
          y: headerTextY,
          size: 8,
          font: boldFont,
          color: white,
        });

        page.drawText("DAILY STREAK", {
          x: columns.streak.x + 9,
          y: headerTextY,
          size: 8,
          font: boldFont,
          color: white,
        });

        currentY -= headerHeight;

        /*
         * TABLE ROWS
         */

        pageUsers.forEach((user, index) => {
          const globalIndex = start + index;

          const rank = globalIndex + 1;

          const rowY = currentY - rowHeight;

          /*
           * Alternating row background
           */

          page.drawRectangle({
            x: leftMargin,
            y: rowY,
            width: tableWidth,
            height: rowHeight,
            color: index % 2 === 0 ? veryLightGray : white,
          });

          /*
           * Row divider
           */

          page.drawLine({
            start: {
              x: leftMargin,
              y: rowY,
            },

            end: {
              x: pageWidth - rightMargin,
              y: rowY,
            },

            thickness: 0.5,
            color: lightGray,
          });

          const textY = rowY + 10;

          /*
           * Rank
           */

          page.drawText(String(rank), {
            x: columns.rank.x + 11,
            y: textY,
            size: 9.5,
            font: rank <= 3 ? boldFont : regularFont,
            color: rank <= 3 ? orange : dark,
          });

          /*
           * Username
           */

          const username =
            user.username.length > 32
              ? `${user.username.slice(0, 31)}...`
              : user.username;

          page.drawText(username, {
            x: columns.username.x + 9,
            y: textY,
            size: 9.5,
            font: boldFont,
            color: dark,
          });

          /*
           * Points
           */

          page.drawText(formatNumber(user.totalPoints), {
            x: columns.points.x + 9,
            y: textY,
            size: 9.5,
            font: regularFont,
            color: dark,
          });

          /*
           * Streak
           */

          page.drawText(String(user.currentStreak), {
            x: columns.streak.x + 9,
            y: textY,
            size: 9.5,
            font: regularFont,
            color: dark,
          });

          currentY = rowY;
        });

        /*
         * TABLE OUTLINE
         */

        const tableBottom = currentY;

        page.drawRectangle({
          x: leftMargin,
          y: tableBottom,
          width: tableWidth,
          height: contentTop - tableBottom,
          borderColor: lightGray,
          borderWidth: 0.8,
        });

        /*
         * SUMMARY
         */

        const summaryY = tableBottom - 31;

        page.drawText("Leaderboard Summary", {
          x: leftMargin,
          y: summaryY,
          size: 9,
          font: boldFont,
          color: dark,
        });

        page.drawText(
          `${formatNumber(users.length)} players included in this export`,
          {
            x: leftMargin,
            y: summaryY - 15,
            size: 8,
            font: regularFont,
            color: gray,
          },
        );

        /*
         * FOOTER
         */

        page.drawLine({
          start: {
            x: leftMargin,
            y: footerY + 20,
          },

          end: {
            x: pageWidth - rightMargin,
            y: footerY + 20,
          },

          thickness: 0.7,
          color: lightGray,
        });

        page.drawText("TinkHubb Trivia - Admin Leaderboard Export", {
          x: leftMargin,
          y: footerY + 7,
          size: 7.5,
          font: regularFont,
          color: gray,
        });

        page.drawText(`Page ${pageNumber}`, {
          x: pageWidth - rightMargin - 38,
          y: footerY + 7,
          size: 7.5,
          font: regularFont,
          color: gray,
        });
      }
    }

    const pdfBytes = await pdfDoc.save();

    const filename = `tinkhubb-leaderboard-${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,

      headers: {
        "Content-Type": "application/pdf",

        "Content-Disposition": `attachment; filename="${filename}"`,

        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Leaderboard export error:", error);

    return NextResponse.json(
      {
        message: "Unable to export leaderboard.",
      },
      {
        status: 500,
      },
    );
  }
}
