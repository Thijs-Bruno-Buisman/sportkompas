"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/supabase/AuthContext";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Cloud, Lock, Mail, UserPlus, LogIn } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        onClose();
      } else {
        const { error } = await signUpWithEmail(email, password);
        if (error) throw error;
        setSuccessMessage("Account succesvol aangemaakt! Controleer eventueel je e-mail ter verificatie.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Er ging iets mis tijdens het inloggen.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "login" ? "Inloggen bij SportKompas Cloud" : "Nieuw Cloud Account Aanmaken"}
      description="Synchroniseer je workouts, schema's en voeding veilig tussen al je apparaten."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success">
            {successMessage}
          </Alert>
        )}

        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
          <Cloud className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Offline-first: Je data blijft altijd lokaal in je browser beschikbaar. Cloud-sync bewaart veilig een back-up.
          </span>
        </div>

        <FormField label="E-mailadres">
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <Input
              type="email"
              placeholder="jouw@email.nl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              required
            />
          </div>
        </FormField>

        <FormField label="Wachtwoord">
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
              required
            />
          </div>
        </FormField>

        <div className="pt-2 flex flex-col gap-2">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="w-full min-h-[48px] font-semibold"
            leftIcon={mode === "login" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          >
            {isLoading ? "Bezig..." : mode === "login" ? "Inloggen" : "Account Registreren"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setErrorMessage(null);
            }}
            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            {mode === "login"
              ? "Nog geen account? Maak er hier een aan"
              : "Heb je al een account? Log hier in"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

