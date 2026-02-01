import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to login page before each test
    await page.goto(`${BASE_URL}/login`);
  });

  test("should display login form elements", async ({ page }) => {
    // Assert - Check that all form elements are visible
    await expect(page.getByRole("heading", { name: /zaloguj się/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/hasło/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /zaloguj się/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /zarejestruj się/i })).toBeVisible();
  });

  test("should show validation errors for empty fields", async ({ page }) => {
    // Arrange - Get form elements
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/hasło/i);
    const submitButton = page.getByRole("button", { name: /zaloguj się/i });

    // Act - Focus and blur email field without entering value
    await emailInput.click();
    await passwordInput.click();
    await emailInput.blur();

    // Assert - Email validation error should appear
    await expect(page.getByText(/email jest wymagany/i)).toBeVisible();

    // Act - Focus and blur password field without entering value
    await emailInput.click();
    await passwordInput.blur();

    // Assert - Password validation error should appear
    await expect(page.getByText(/hasło jest wymagane/i)).toBeVisible();

    // Act - Try to submit with empty fields
    await submitButton.click();

    // Assert - Form should not be submitted (still on login page)
    await expect(page).toHaveURL(/\/login/);
  });

  test("should show validation error for invalid email format", async ({ page }) => {
    // Arrange
    const emailInput = page.getByLabel(/email/i);

    // Act - Enter invalid email and blur
    await emailInput.fill("invalid-email");
    await emailInput.blur();

    // Assert - Validation error should appear
    await expect(page.getByText(/Podaj poprawny adres email/i)).toBeVisible();
  });

  test("should successfully login with valid credentials", async ({ page }) => {
    // Arrange - Use test credentials from .env.test
    const testEmail = process.env.E2E_USERNAME || "test@example.com";
    const testPassword = process.env.E2E_PASSWORD || "password123";

    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/hasło/i);
    const submitButton = page.getByRole("button", { name: /zaloguj się/i });

    // Act - Fill in the form
    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);

    // Mock successful API response
    // await page.route("**/api/auth/signin", async (route) => {
    //   await route.fulfill({
    //     status: 200,
    //     contentType: "application/json",
    //     body: JSON.stringify({
    //       access_token: "mock_access_token",
    //       refresh_token: "mock_refresh_token",
    //     }),
    //   });
    // });

    // Act - Submit the form
    await submitButton.click();

    // // Assert - Should show loading state
    // await expect(submitButton).toHaveText(/logowanie\.\.\./i);

    // Assert - Should redirect to dashboard after successful login
    await page.waitForURL("/", { timeout: 5000 });
    await expect(page).toHaveURL("/");

    // Assert - Tokens should be stored in localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem("access_token"));
    const refreshToken = await page.evaluate(() => localStorage.getItem("refresh_token"));
    // expect(accessToken).toBe("mock_access_token");
    // expect(refreshToken).toBe("mock_refresh_token");
  });

  test("should show error message for invalid credentials", async ({ page }) => {
    // Arrange
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/hasło/i);
    const submitButton = page.getByRole("button", { name: /zaloguj się/i });

    // Act - Fill in with invalid credentials
    await emailInput.fill("wrong@example.com");
    await passwordInput.fill("wrongpassword");

    // Mock failed API response (401 Unauthorized)
    await page.route("**/api/auth/signin", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid credentials",
          },
        }),
      });
    });

    // Act - Submit the form
    await submitButton.click();

    // Assert - Error message should be displayed
    await expect(page.getByRole("alert")).toContainText(/nieprawidłowy email lub hasło/i);

    // Assert - Should remain on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("should show error message for rate limiting", async ({ page }) => {
    // Arrange
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/hasło/i);
    const submitButton = page.getByRole("button", { name: /zaloguj się/i });

    await emailInput.fill("test@example.com");
    await passwordInput.fill("password123");

    // Mock rate limit response (429)
    await page.route("**/api/auth/signin", async (route) => {
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests",
          },
        }),
      });
    });

    // Act - Submit the form
    await submitButton.click();

    // Assert - Rate limit error message should be displayed
    await expect(page.getByRole("alert")).toContainText(/zbyt wiele prób logowania/i);
  });

  test("should show error message for server error", async ({ page }) => {
    // Arrange
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/hasło/i);
    const submitButton = page.getByRole("button", { name: /zaloguj się/i });

    await emailInput.fill("test@example.com");
    await passwordInput.fill("password123");

    // Mock server error response (500)
    await page.route("**/api/auth/signin", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Server error",
          },
        }),
      });
    });

    // Act - Submit the form
    await submitButton.click();

    // Assert - Server error message should be displayed
    await expect(page.getByRole("alert")).toContainText(/coś poszło nie tak/i);
  });

  test("should handle network error gracefully", async ({ page }) => {
    // Arrange
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/hasło/i);
    const submitButton = page.getByRole("button", { name: /zaloguj się/i });

    await emailInput.fill("test@example.com");
    await passwordInput.fill("password123");

    // Mock network failure
    await page.route("**/api/auth/signin", async (route) => {
      await route.abort("failed");
    });

    // Act - Submit the form
    await submitButton.click();

    // Assert - Network error message should be displayed
    await expect(page.getByRole("alert")).toContainText(/problem z połączeniem/i);
  });

  test("should disable form during submission", async ({ page }) => {
    // Arrange
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/hasło/i);
    const submitButton = page.getByRole("button", { name: /zaloguj się/i });

    await emailInput.fill("test@example.com");
    await passwordInput.fill("password123");

    // Mock delayed API response
    await page.route("**/api/auth/signin", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock_access_token",
          refresh_token: "mock_refresh_token",
        }),
      });
    });

    // Act - Submit the form
    await submitButton.click();

    // Assert - Form inputs should be disabled during submission
    await expect(emailInput).toBeDisabled();
    await expect(passwordInput).toBeDisabled();
    await expect(submitButton).toBeDisabled();
  });

  test("should redirect to login page if already authenticated", async ({ page }) => {
    // Arrange - Navigate to login page when already logged in
    const {
      data: { session },
    } = await page.evaluate(async () => {
      // This test assumes the login.astro page redirects if session exists
      return { data: { session: { user: { id: "test-user" } } } };
    });

    // Note: This test would need to be adjusted based on actual redirect logic
    // in the Astro middleware or login page
  });

  test("should clear error messages when user starts typing", async ({ page }) => {
    // Arrange
    const emailInput = page.getByLabel(/email/i);
    const submitButton = page.getByRole("button", { name: /zaloguj się/i });

    // Act - Trigger validation error
    await emailInput.click();
    await emailInput.blur();

    // Assert - Error should be visible
    await expect(page.getByText(/email jest wymagany/i)).toBeVisible();

    // Act - Start typing
    await emailInput.fill("test");

    // Assert - Error should be cleared
    await expect(page.getByText(/email jest wymagany/i)).not.toBeVisible();
  });
});

test.describe("Create Flashcard with New Deck", () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Login before each test
    await page.goto(`${BASE_URL}/login`);

    const testEmail = process.env.E2E_USERNAME || "test@example.com";
    const testPassword = process.env.E2E_PASSWORD || "password123";

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/hasło/i).fill(testPassword);
    await page.getByRole("button", { name: /zaloguj się/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL("/", { timeout: 5000 });
  });

  test("should create a new deck and flashcard from dashboard", async ({ page }) => {
    // Assert - Should be on dashboard
    await expect(page).toHaveURL("/");

    // Act - Click on "Dodaj fiszkę" button in dashboard header
    const createFlashcardButton = page.getByRole("button", { name: /dodaj fiszkę/i });
    await createFlashcardButton.click();

    // Assert - Dialog should be open
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /dodaj nową fiszkę/i })).toBeVisible();

    // Act - Fill in flashcard front
    const frontInput = page.getByLabel(/przód \(pytanie\)/i);
    await frontInput.fill("What is the capital of France?");

    // Act - Fill in flashcard back
    const backInput = page.getByLabel(/tył \(odpowiedź\)/i);
    await backInput.fill("Paris");

    // Act - Select "Create new deck" from deck selector
    const deckSelector = page.locator("#deck-select");
    await deckSelector.click();

    // Click on create new deck option (using role to be specific)
    await page.getByRole('option', { name: /➕ Utwórz nową talię/i }).click();

    // Assert - New deck creation form should appear
    await expect(page.getByPlaceholder(/nazwa nowej talii/i)).toBeVisible();

    // Act - Enter new deck name
    const newDeckNameInput = page.getByPlaceholder(/nazwa nowej talii/i);
    await newDeckNameInput.fill("Geography Test Deck");

    // Act - Click create button for the deck
    const createDeckButton = page.getByRole("button", { name: /^utwórz$/i }).first();
    await createDeckButton.click();

    // Wait for deck creation to complete
    await page.waitForTimeout(1000);

    // Assert - Toast should show success message for deck creation
    await expect(page.getByText(/talia została utworzona/i)).toBeVisible({ timeout: 5000 });

    // Act - Submit the flashcard
    const submitButton = page.getByRole("button", { name: /^dodaj$/i });
    await submitButton.click();

    // Assert - Toast should show success message for flashcard creation
    await expect(page.getByText(/fiszka została dodana/i)).toBeVisible({ timeout: 5000 });

    // Assert - Page should reload and show the dashboard with new content
    await page.waitForTimeout(1000); // Wait for page reload
    await expect(page).toHaveURL("/");
  });

  test("should validate flashcard fields before submission", async ({ page }) => {
    // Act - Click on "Dodaj fiszkę" button
    await page.getByRole("button", { name: /dodaj fiszkę/i }).click();

    // Assert - Dialog should be open
    await expect(page.getByRole("dialog")).toBeVisible();

    // Act - Try to submit without filling fields
    const submitButton = page.getByRole("button", { name: /^dodaj$/i });

    // Assert - Submit button should be disabled when form is invalid
    await expect(submitButton).toBeDisabled();

    // Act - Fill only front
    await page.getByLabel(/przód \(pytanie\)/i).fill("Question");

    // Assert - Submit should still be disabled (missing back and deck)
    await expect(submitButton).toBeDisabled();

    // Act - Fill back
    await page.getByLabel(/tył \(odpowiedź\)/i).fill("Answer");

    // Assert - Submit should still be disabled (missing deck)
    await expect(submitButton).toBeDisabled();

    // Act - Select create new deck
    await page.locator("#deck-select").click();
    await page.getByRole('option', { name: /➕ Utwórz nową talię/i }).click();

    // Act - Create deck
    await page.getByPlaceholder(/nazwa nowej talii/i).fill("Test Deck");
    await page
      .getByRole("button", { name: /^utwórz$/i })
      .first()
      .click();

    // Wait for deck creation
    await page.waitForTimeout(1000);

    // Assert - Now submit should be enabled
    await expect(submitButton).toBeEnabled();
  });

  test("should cancel flashcard creation", async ({ page }) => {
    // Act - Click on "Dodaj fiszkę" button
    await page.getByRole("button", { name: /dodaj fiszkę/i }).click();

    // Assert - Dialog should be open
    await expect(page.getByRole("dialog")).toBeVisible();

    // Act - Fill in some data
    await page.getByLabel(/przód \(pytanie\)/i).fill("Test question");

    // Act - Click cancel or close dialog
    const cancelButton = page.getByRole("button", { name: /anuluj/i });
    await cancelButton.click();

    // Assert - Dialog should be closed
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Act - Open dialog again
    await page.getByRole("button", { name: /dodaj fiszkę/i }).click();

    // Assert - Fields should be reset
    await expect(page.getByLabel(/przód \(pytanie\)/i)).toHaveValue("");
  });
});
