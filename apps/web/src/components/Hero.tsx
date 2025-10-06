"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background-start via-background-mid to-background-end opacity-60" />
      
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-prim-end/10 rounded-full blur-3xl animate-pulse delay-1000" />

  <div className="relative container mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 text-center lg:text-left space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Fresh Groceries Delivered Daily</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-foreground">Growseries</span>
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg, var(--prim-start), var(--prim-end))",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                }}
              >
                Fresh & Fast
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Experience the easiest way to shop for groceries. Fresh produce from local stores delivered to your doorstep in hours, not days.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link
                href="/products"
                className="group bg-primary-gradient hover:opacity-90 text-primary-foreground px-8 py-4 rounded-2xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Start Shopping
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/products"
                className="bg-card/80 backdrop-blur-sm hover:bg-card text-foreground px-8 py-4 rounded-2xl text-lg font-semibold transition-all border border-border/50 hover:border-primary/30 flex items-center justify-center gap-2"
              >
                Browse Products
              </Link>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span>Same-day delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-300" />
                <span>Fresh guarantee</span>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center lg:justify-end animate-fade-in">
            <div className="relative w-full max-w-2xl lg:max-w-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-prim-start to-prim-end opacity-20 blur-3xl rounded-full scale-90" />

              <div className="relative">
                <Image
                  src="/images/hero-bag.png"
                  alt="Grocery bag filled with fresh vegetables and produce"
                  width={900}
                  height={700}
                  priority
                  sizes="(max-width: 640px) 90vw, (max-width: 1280px) 50vw, 600px"
                  className="relative z-10 drop-shadow-2xl animate-float"
                />
              </div>

              <div className="absolute top-10 -left-4 bg-card/90 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-lg border border-border/50 animate-float-delayed">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🥬</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Fresh</p>
                    <p className="font-semibold text-sm text-foreground">Vegetables</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-16 -right-4 bg-card/90 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-lg border border-border/50 animate-float">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery in</p>
                    <p className="font-semibold text-sm text-foreground">2-3 Hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float 6s ease-in-out infinite;
          animation-delay: 1s;
        }

        .delay-300 {
          animation-delay: 300ms;
        }

        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </section>
  );
}
