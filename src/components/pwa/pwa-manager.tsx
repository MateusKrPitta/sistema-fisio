"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalledSuccess, setIsInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Em desenvolvimento, DESATIVA completamente o Service Worker e limpa os caches
    // Isso evita interceptação de pacotes de compilação do Next.js e restaura a velocidade instantânea do sistema
    if (process.env.NODE_ENV === "development") {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
        if ("caches" in window) {
          caches.keys().then((keys) => {
            keys.forEach((key) => caches.delete(key));
          });
        }
      }
    } else {
      // Em produção, registra o Service Worker para suporte PWA
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }
    }

    // 2. Verifica se já está rodando em modo aplicativo instalado (Standalone)
    const checkStandalone = () => {
      const isDisplayStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isIosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      return isDisplayStandalone || isIosStandalone;
    };

    if (checkStandalone()) {
      setIsStandalone(true);
      return;
    }

    // 3. Detecta se é iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isAppleDevice);

    // 4. Captura evento nativo do Chrome/Android/Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalledSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => {
        setIsInstalledSuccess(false);
        setIsStandalone(true);
      }, 4000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Verifica se usuário dispensou nesta sessão
    const dismissed = sessionStorage.getItem("fismovie_pwa_dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalledSuccess(true);
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      // Fallback amigável se o navegador no momento não permitir disparo direto
      alert("Para instalar no computador/celular, clique no ícone de instalar na barra de endereços do navegador ou adicione aos favoritos!");
    }
  };

  useEffect(() => {
    const handleGlobalTrigger = () => {
      handleInstallClick();
    };
    window.addEventListener("open-pwa-install", handleGlobalTrigger);
    return () => {
      window.removeEventListener("open-pwa-install", handleGlobalTrigger);
    };
  }, [deferredPrompt, isIos]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("fismovie_pwa_dismissed", "true");
  };

  // Não exibe se já for standalone ou se o usuário dispensou ou se não for instalável no momento
  const canShowPrompt = !isStandalone && !isDismissed && (Boolean(deferredPrompt) || isIos);

  return (
    <>
      {/* Toast / Banner Flutuante de Instalação */}
      <AnimatePresence>
        {canShowPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 pointer-events-auto"
          >
            <div className="relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 dark:border-blue-500/20 p-4 rounded-2xl shadow-2xl shadow-blue-900/20 dark:shadow-black/50">
              {/* Luz sutil de destaque no fundo */}
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start gap-3.5 relative z-10">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/25">
                  <Smartphone className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Aplicativo Oficial
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                    Instalar FisMovie no Celular
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    Acesso rápido na tela inicial, sem barra de navegador e funcionamento ultra-rápido mesmo sem Wi-Fi.
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={handleInstallClick}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {isIos ? "Como Adicionar" : "Instalar Agora"}
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
                    >
                      Agora não
                    </button>
                  </div>
                </div>

                {/* Botão Fechar */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Fechar aviso"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notificação de Sucesso após Instalar */}
      <AnimatePresence>
        {isInstalledSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-sm font-semibold"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Aplicativo FisMovie instalado com sucesso!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Guia para Usuários iOS (Safari no iPhone/iPad) */}
      <AnimatePresence>
        {showIosGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowIosGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-3 mb-6">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Instalar no iPhone ou iPad
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Siga estes 2 passos rápidos no Safari para criar o ícone do FisMovie na sua tela de início:
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                      Toque em Compartilhar <Share className="w-3.5 h-3.5 inline text-blue-500" />
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Na barra inferior do Safari, clique no ícone quadrado com a seta para cima.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                      Adicionar à Tela de Início <PlusSquare className="w-3.5 h-3.5 inline text-blue-500" />
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Role as opções para baixo e toque em &quot;Adicionar à Tela de Início&quot;.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIosGuide(false)}
                className="w-full mt-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Entendi, fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
