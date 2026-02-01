import { useState, useRef, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Komponent formularza logowania
 * Odpowiedzialny za autentykację użytkownika przez Supabase Auth
 */

/**
 * Komponent formularza logowania
 * Odpowiedzialny za autentykację użytkownika przez Supabase Auth
 */
export default function LoginForm() {
  // Stan komponentu
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Ref dla fokusa na polu email po błędzie
  const emailInputRef = useRef<HTMLInputElement>(null);

  /**
   * Walidacja formatu email
   */
  const validateEmail = (email: string): string | null => {
    if (!email) return "Email jest wymagany";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Podaj poprawny adres email";
    }
    return null;
  };

  /**
   * Walidacja hasła
   */
  const validatePassword = (password: string): string | null => {
    if (!password) return "Hasło jest wymagane";
    return null;
  };

  /**
   * Obsługa blur na polu email - walidacja w czasie rzeczywistym
   */
  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  /**
   * Obsługa blur na polu hasła - walidacja w czasie rzeczywistym
   */
  const handlePasswordBlur = () => {
    setPasswordError(validatePassword(password));
  };

  /**
   * Mapowanie błędów API na przyjazne komunikaty
   */
  const getErrorMessage = (status: number): string => {
    if (status === 400) {
      return "Nieprawidłowy email lub hasło";
    }
    if (status === 401) {
      return "Nieprawidłowy email lub hasło";
    }
    if (status === 429) {
      return "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.";
    }
    if (status === 500) {
      return "Coś poszło nie tak. Spróbuj ponownie za chwilę.";
    }

    return "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";
  };

  /**
   * Obsługa submisji formularza
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Zapobieganie wielokrotnemu submisji
    if (isLoading) return;

    // Reset wszystkich błędów
    setEmailError(null);
    setPasswordError(null);
    setError(null);

    // Walidacja przed wysłaniem
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (emailValidation || passwordValidation) {
      setEmailError(emailValidation);
      setPasswordError(passwordValidation);
      return;
    }

    // Rozpoczęcie ładowania
    setIsLoading(true);

    try {
      // Wywołanie endpointu /api/auth/signin
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Obsługa błędów z API
        setError(getErrorMessage(response.status));
        setIsLoading(false);
        emailInputRef.current?.focus();
        return;
      }

      // Sukces! Zapisanie tokenów w localStorage
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }

      // Przekierowanie na dashboard
      window.location.href = "/";
    } catch {
      // Błąd sieci lub inny nieoczekiwany błąd
      setError("Problem z połączeniem. Sprawdź internet i spróbuj ponownie.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Nagłówek */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Zaloguj się</h1>
        <p className="text-sm text-neutral-600">Wprowadź swoje dane aby uzyskać dostęp do konta</p>
      </div>

      {/* Formularz */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error banner - pokazywany gdy wystąpi błąd */}
        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Pole Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              // Czyszczenie błędu gdy użytkownik zaczyna pisać
              if (emailError) setEmailError(null);
            }}
            onBlur={handleEmailBlur}
            placeholder="twoj@email.com"
            required
            autoComplete="email"
            disabled={isLoading}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
            ref={emailInputRef}
          />
          {emailError && (
            <p id="email-error" className="text-sm text-red-600" role="alert">
              {emailError}
            </p>
          )}
        </div>

        {/* Pole Hasło */}
        <div className="space-y-2">
          <Label htmlFor="password">Hasło</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              // Czyszczenie błędu gdy użytkownik zaczyna pisać
              if (passwordError) setPasswordError(null);
            }}
            onBlur={handlePasswordBlur}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            disabled={isLoading}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? "password-error" : undefined}
          />
          {passwordError && (
            <p id="password-error" className="text-sm text-red-600" role="alert">
              {passwordError}
            </p>
          )}
        </div>

        {/* Przycisk Submit */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Logowanie..." : "Zaloguj się"}
        </Button>
      </form>

      {/* Link do rejestracji */}
      <div className="text-center text-sm">
        <span className="text-neutral-600">Nie masz konta? </span>
        <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
          Zarejestruj się
        </a>
      </div>
    </div>
  );
}
