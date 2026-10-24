import { test, expect } from "@playwright/test";
test("teaches, travels autonomously, ends and preserves a life", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto("/");
  await page.screenshot({
    path: `test-results/title-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "最後の授業をはじめる" }).click();
  await page.getByRole("button", { name: "この子に、教える" }).click();
  await expect(page.locator("textarea")).toHaveCount(3);
  await page.getByRole("button", { name: "この3つを教える" }).click();
  await page.getByRole("button", { name: "いってらっしゃい、ルカ" }).click();
  for (let i = 0; i < 28; i++) {
    await page.getByRole("button", { name: /^この子に任せる/ }).click();
    await page
      .getByRole("button", { name: "どうして、そうしたの？", exact: false })
      .click();
    if (i === 3)
      await page.screenshot({
        path: `test-results/journey-${test.info().project.name}.png`,
        fullPage: true,
      });
    if (
      await page.getByRole("button", { name: "最後の記録を開く" }).isVisible()
    ) {
      await page.getByRole("button", { name: "最後の記録を開く" }).click();
      break;
    }
    await page.getByRole("button", { name: /^旅を見届ける/ }).click();
  }
  await expect(page.getByText("はじまりは、この3つでした。")).toBeVisible();
  expect(browserErrors).toEqual([]);
  await page.screenshot({
    path: `test-results/ending-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.locator(".timeline article").count(),
  ).toBeGreaterThanOrEqual(20);
  await page.getByRole("button", { name: "人生の記録を読む" }).click();
  await expect(page.locator(".record-row")).toHaveCount(1);
  await page.reload();
  await page
    .getByRole("button", { name: "人生の記録", exact: false })
    .first()
    .click();
  await expect(page.locator(".record-row")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

test("edits the interpretation, resumes a saved journey and spends exactly two interventions", async ({
  page,
}) => {
  await page.route("**/api/analyze", (route) =>
    route.fulfill({ status: 503, body: "offline" }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "最後の授業をはじめる" }).click();
  await page.getByRole("button", { name: "この子に、教える" }).click();
  await page.getByRole("button", { name: "この3つを教える" }).click();
  await expect(page.locator(".source-badge")).toContainText("ローカル");
  await page
    .locator(".review-card")
    .first()
    .getByLabel("行動のよりどころ")
    .selectOption("freedom");
  await page.getByRole("button", { name: "いってらっしゃい、ルカ" }).click();
  await page.getByRole("button", { name: /^この子に任せる/ }).click();
  await page.getByRole("button", { name: /^旅を見届ける/ }).click();
  const age = await page.locator(".journey-top h2").innerText();
  await page.reload();
  await page.getByRole("button", { name: /旅のつづきから/ }).click();
  await expect(page.locator(".journey-top h2")).toHaveText(age);
  let used = 0;
  for (let i = 0; i < 18 && used < 2; i++) {
    await expect(
      page.getByRole("button", { name: /^この子に任せる/ }),
    ).toBeVisible();
    if (await page.locator(".priority-list button").count()) {
      await page.locator(".priority-list button").first().click();
      await page
        .getByRole("button", { name: /^教え1を、思い出してもらう/ })
        .click();
      used++;
    } else await page.getByRole("button", { name: /^この子に任せる/ }).click();
    await page.getByRole("button", { name: /^旅を見届ける/ }).click();
  }
  expect(used).toBe(2);
  await expect(page.locator(".intervention-count")).toContainText("あと0回");
  await expect(page.locator(".priority-list button")).toHaveCount(0);
});
