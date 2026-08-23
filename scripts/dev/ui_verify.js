const { chromium } = require("playwright");

const baseUrl = process.env.UI_BASE_URL || "http://127.0.0.1:19006";

function uniqueSuffix() {
  return Date.now().toString().slice(-6);
}

async function clickText(page, text) {
  await page.getByText(text, { exact: true }).click();
}

async function selectDropdownByIndex(page, index, optionText) {
  const dropdown = page.locator('[class*="dropdown"]').nth(index);
  await dropdown.click();
  await page.getByText(optionText, { exact: true }).click();
}

async function fillPatientForm(page, suffix) {
  await clickText(page, "New Patient");
  await page.getByText("Ajouter un patient").waitFor({ state: "visible" });

  const inputs = page.locator("input");
  await inputs.nth(0).fill(`UITest${suffix}`);
  await inputs.nth(1).fill(`Patient${suffix}`);
  await inputs.nth(2).fill("1990-01-15");
  await inputs.nth(3).fill("Lagos");

  await selectDropdownByIndex(page, 0, "male");
  await selectDropdownByIndex(page, 1, "single");

  await clickText(page, "Address");
  await page.locator("input").nth(4).fill(`080${suffix}`);
  await page.locator("input").nth(5).fill(`uitest${suffix}@example.com`);
  await page.locator("input").nth(6).fill("Test Street");
  await page.locator("input").nth(7).fill("Ikeja");
  await page.locator("input").nth(8).fill("Lagos");

  await clickText(page, "Enregistrer");
  await page.getByText("Succès").waitFor({ timeout: 15000 }).catch(() => {});
  await page.getByText(`UITest${suffix} Patient${suffix}`).waitFor({ timeout: 15000 });
}

async function createVisit(page, patientName) {
  await page.goto(`${baseUrl}/visits`, { waitUntil: "networkidle" });
  await clickText(page, "Nouveau RDV");
  await page.getByText("Nouveau rendez-vous").waitFor({ state: "visible" });

  const inputs = page.locator("input");
  await inputs.nth(0).fill(patientName);
  await page.getByText(patientName, { exact: true }).click();
  await inputs.nth(1).fill("Dr Amina Rahmani");
  await page.getByText("Dr Amina Rahmani", { exact: true }).click();
  await inputs.nth(2).fill("09:45");

  await clickText(page, "Enregistrer");
  await page.getByText(patientName, { exact: false }).waitFor({ timeout: 15000 });
}

async function createInvite(page, suffix) {
  await page.goto(`${baseUrl}/users`, { waitUntil: "networkidle" });
  await page.getByText("Clinic Team").waitFor({ state: "visible" });
  await page.locator("input").last().fill(`invite${suffix}@example.com`);
  await clickText(page, "Create invite link");
  await page.getByText("Latest invite link").waitFor({ timeout: 15000 });
}

async function verifyPageHasNoError(page, path, markerTexts, blockedTexts) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  for (const marker of markerTexts) {
    await page.getByText(marker, { exact: false }).waitFor({ timeout: 15000 });
  }
  for (const blockedText of blockedTexts) {
    const locator = page.getByText(blockedText, { exact: false });
    if (await locator.count()) {
      throw new Error(`Blocked text found on ${path}: ${blockedText}`);
    }
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const suffix = uniqueSuffix();
  const patientName = `UITest${suffix} Patient${suffix}`;
  const results = [];

  const step = async (name, fn) => {
    try {
      await fn();
      results.push({ name, ok: true });
    } catch (error) {
      await page.screenshot({ path: `tmp/${name}.png`, fullPage: true }).catch(() => {});
      results.push({ name, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  };

  await step("login", async () => {
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    await page.getByPlaceholder("doctor@clinic.com").fill("test1@gmail.com");
    await page.locator('input[type="password"]').fill("test1");
    await clickText(page, "Sign In");
    await page.waitForURL(/dashboard/, { timeout: 20000 });
  });

  await step("patients_create", async () => {
    await page.goto(`${baseUrl}/patients`, { waitUntil: "networkidle" });
    await page.getByText("Patients").waitFor({ state: "visible" });
    await fillPatientForm(page, suffix);
  });

  await step("visits_create", async () => {
    await createVisit(page, patientName);
  });

  await step("users_invite_create", async () => {
    await createInvite(page, suffix);
  });

  await step("payments_page", async () => {
    await verifyPageHasNoError(
      page,
      "/payments",
      ["Payments"],
      ["Could not find a relationship between 'payments' and 'patients' in the schema cache"],
    );
  });

  await step("reports_page", async () => {
    await verifyPageHasNoError(
      page,
      "/reports",
      ["Reports"],
      ["operator does not exist: appointment_status_enum = text"],
    );
  });

  await step("notifications_page", async () => {
    await verifyPageHasNoError(
      page,
      "/notifications",
      ["Notifications"],
      ["Could not find the function public.rpc_get_notifications"],
    );
  });

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
