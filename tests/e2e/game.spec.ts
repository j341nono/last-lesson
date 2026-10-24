import { test, expect, type Page } from "@playwright/test";
async function fits(page: Page) {
  const overflow = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll<HTMLElement>(
        "main, section, textarea, dialog[open], .sheet-body, .film-caption, .review-card, .book-content, .journey-buttons, .choice-summary",
      ),
    )
      .filter((el) => el.clientHeight && el.getBoundingClientRect().width)
      .flatMap((el) => {
        const r = el.getBoundingClientRect();
        return el.scrollHeight > el.clientHeight + 3 ||
          el.scrollWidth > el.clientWidth + 3 ||
          r.bottom > innerHeight + 2 ||
          r.top < -2
          ? [
              {
                element: el.className,
                height: [el.clientHeight, el.scrollHeight],
                width: [el.clientWidth, el.scrollWidth],
                bottom: r.bottom,
              },
            ]
          : [];
      }),
  );
  expect(overflow).toEqual([]);
  expect(await page.evaluate(() => scrollY)).toBe(0);
}
async function teach(page: Page) {
  await page.goto("/");
  await fits(page);
  await page.getByRole("button", { name: "最後の授業をはじめる" }).click();
  for (let i = 0; i < 2; i++) {
    await fits(page);
    await page.getByRole("button", { name: "その先へ" }).click();
  }
  await page.getByRole("button", { name: "この子に、教える" }).click();
  for (let i = 0; i < 2; i++) {
    await fits(page);
    await page.getByRole("button", { name: "次の教えへ" }).click();
  }
  await fits(page);
  await page.getByRole("button", { name: "この3つを教える" }).click();
  await expect(page.locator(".review-card")).toBeVisible();
  await fits(page);
}
async function depart(page: Page) {
  for (let i = 0; i < 2; i++)
    await page.getByRole("button", { name: "次の解釈へ" }).click();
  await page.getByRole("button", { name: "いってらっしゃい、ルカ" }).click();
}
test("a full life fits the screen, including details, ending and paginated records", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await teach(page);
  await depart(page);
  let events = 0;
  for (; events < 28; events++) {
    await fits(page);
    await page.getByRole("button", { name: "この子に任せる" }).click();
    await fits(page);
    if (events === 3) {
      await page.screenshot({
        path: `test-results/film-${test.info().project.name}.png`,
      });
      await page
        .getByRole("button", { name: "判断の理由", exact: true })
        .click();
      await fits(page);
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "閉じる", exact: true })
        .click();
    }
    if (
      await page.getByRole("button", { name: "最後の記録を開く" }).isVisible()
    ) {
      await page.getByRole("button", { name: "最後の記録を開く" }).click();
      events++;
      break;
    }
    await page
      .getByRole("button", { name: "旅を見届ける", exact: false })
      .click();
  }
  expect(events).toBeGreaterThanOrEqual(20);
  await fits(page);
  await page.screenshot({
    path: `test-results/ending-${test.info().project.name}.png`,
  });
  await page.getByRole("button", { name: "3つの教え", exact: true }).click();
  await expect(page.getByText("はじまりは、この3つでした。")).toBeVisible();
  await fits(page);
  await page.getByRole("button", { name: "出会いと約束", exact: true }).click();
  await fits(page);
  await page.getByRole("button", { name: "人生年表", exact: true }).click();
  for (let i = 1; i < events; i++)
    await page.getByRole("button", { name: "年表を次へ", exact: true }).click();
  await fits(page);
  await expect(
    page.getByRole("button", { name: "年表を次へ", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "この人生を公開する" }).click();
  await fits(page);
  await expect(
    page.getByRole("button", { name: "人生記録を公開する" }),
  ).toBeDisabled();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "閉じる", exact: true })
    .click();
  await page.getByRole("button", { name: "人生の記録を読む" }).click();
  await expect(page.locator(".record-row")).toHaveCount(1);
  await fits(page);
  await page.locator(".record-row").click();
  await fits(page);
  await page.getByRole("button", { name: "記録一覧", exact: false }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "人生の記録", exact: false })
    .first()
    .click();
  await expect(page.locator(".record-row")).toHaveCount(1);
  expect(errors).toEqual([]);
});
test("offline interpretation, resume and two interventions fit without scrolling", async ({
  page,
}) => {
  await page.route("**/api/analyze", (r) =>
    r.fulfill({ status: 503, body: "offline" }),
  );
  await teach(page);
  await expect(page.locator(".source-badge")).toContainText("ローカル");
  await page.getByLabel("行動のよりどころ").selectOption("freedom");
  await depart(page);
  await page.getByRole("button", { name: "この子に任せる" }).click();
  await page
    .getByRole("button", { name: "旅を見届ける", exact: false })
    .click();
  const age = await page.locator(".journey-top h2").innerText();
  await page.reload();
  await page.getByRole("button", { name: /旅のつづきから/ }).click();
  await expect(page.locator(".journey-top h2")).toHaveText(age);
  let used = 0;
  for (let i = 0; i < 18 && used < 2; i++) {
    if (
      await page
        .getByRole("button", { name: "声を届ける", exact: true })
        .count()
    ) {
      await page
        .getByRole("button", { name: "声を届ける", exact: true })
        .click();
      await fits(page);
      if (used === 1) {
        await page
          .getByRole("button", { name: "優先する教えを次へ", exact: true })
          .click();
        await page
          .getByRole("button", { name: "優先する教えを次へ", exact: true })
          .click();
        await expect(page.locator(".priority-list")).toContainText(
          "約束は必ず守りなさい",
        );
      }
      await page.locator(".priority-list button").first().click();
      used++;
    } else await page.getByRole("button", { name: "この子に任せる" }).click();
    await page
      .getByRole("button", { name: "旅を見届ける", exact: false })
      .click();
  }
  expect(used).toBe(2);
  await expect(page.locator(".intervention-count")).toContainText("あと0回");
  await expect(
    page.getByRole("button", { name: "声を届ける", exact: true }),
  ).toHaveCount(0);
  await fits(page);
});
test("long input and all editor pages remain accessible on short screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await fits(page);
  await page.getByRole("button", { name: "最後の授業をはじめる" }).click();
  await page.getByRole("button", { name: "その先へ" }).click();
  await page.getByRole("button", { name: "その先へ" }).click();
  await page.getByRole("button", { name: "この子に、教える" }).click();
  await page
    .locator("textarea")
    .fill(
      "困っている人に優しくして、自分を守ることも忘れず、約束と自由の間で何を選ぶかを考え続けてください。"
        .repeat(2)
        .slice(0, 100),
    );
  await fits(page);
  await page.getByRole("button", { name: /名前・シードを変える/ }).click();
  await fits(page);
  await page.getByRole("button", { name: "この名前で" }).click();
  await page.getByRole("button", { name: "次の教えへ" }).click();
  await page.getByRole("button", { name: "次の教えへ" }).click();
  await page.getByRole("button", { name: "この3つを教える" }).click();
  await fits(page);
  await expect(page.locator(".review-card")).toBeVisible();
  await fits(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await fits(page);
  await depart(page);
  await fits(page);
  await page.getByRole("button", { name: "この子に任せる" }).click();
  await fits(page);
  await page.setViewportSize({ width: 320, height: 568 });
  await fits(page);
  await page.getByRole("button", { name: "機体と記憶を見る" }).click();
  await fits(page);
});

test("animation runs, and manual captions remain manual in the next scene", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await teach(page);
  await depart(page);
  const before = await page
    .locator(".film-scene canvas")
    .evaluate((el) => (el as HTMLCanvasElement).toDataURL());
  await page.waitForFunction(
    (previous) =>
      document
        .querySelector<HTMLCanvasElement>(".film-scene canvas")
        ?.toDataURL() !== previous,
    before,
  );
  await page.getByRole("button", { name: "字幕の自動送りを止める" }).click();
  await page.getByRole("button", { name: "カットを次へ", exact: true }).click();
  await expect(page.locator(".film-scene")).toHaveAttribute("data-cut", "1");
  await page.getByRole("button", { name: "この子に任せる" }).click();
  await expect(
    page.getByRole("button", { name: "字幕を自動で送る" }),
  ).toBeVisible();
  await fits(page);
});
