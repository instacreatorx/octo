"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function LandingPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission - redirect to chat
    window.location.href = '/chat';
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl float"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-600/30 rounded-full blur-3xl float" style={{ animationDelay: '-3s' }}></div>
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* عنوان اصلی با افکت معروف موج فکر کردن */}
          <div className="relative inline-block">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight bg-gradient-to-l from-white to-gray-400 bg-clip-text text-transparent">
              هوش تجاری فقط با پرامپت فارسی
            </h1>
            
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
              <div className="thinking-overlay h-full w-2/3 bg-gradient-to-r from-transparent via-white/12 to-transparent blur-2xl"></div>
            </div>
          </div>

          <p className="mt-8 text-2xl md:text-3xl text-gray-400 font-light max-w-3xl mx-auto">
            یک پرامپت بزن → SQL دقیق + داشبورد زنده در &lt; 1 ثانیه
          </p>

          {/* دکمه‌ها */}
          <div className="mt-12 flex flex-col sm:flex-row-reverse gap-6 justify-center items-center">
            <Link 
              href="/chat" 
              className="px-12 py-6 bg-white text-black font-bold text-xl rounded-2xl hover:bg-gray-100 transition transform hover:scale-105 shadow-xl"
            >
              شروع پرامپت (رایگان)
            </Link>
            <a 
              href="#demo" 
              className="px-10 py-5 border border-gray-600 font-medium text-xl rounded-2xl hover:bg-white/10 backdrop-blur transition"
            >
              دموی ۸ ثانیه‌ای
            </a>
          </div>

          <p className="mt-16 text-gray-500 text-lg">
            در حال استفاده توسط تیم‌های دیتا در
            <span className="text-white font-bold"> اسنپ ∙ دیجی‌کالا ∙ علی‌بابا ∙ کافه‌آی‌تی ∙ تپسی</span>
          </p>
        </div>

        {/* فلش اسکرول */}
        <div className="absolute bottom-10 right-1/2 translate-x-1/2 animate-bounce">
          <svg className="w-8 h-8 text-gray-600 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7-7-7"/>
          </svg>
      </div>
      </section>

      {/* آمار کوتاه و تمیز */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <div>
            <h3 className="text-6xl font-black text-cyan-400">۰.۶ ثانیه</h3>
            <p className="text-gray-400 mt-3">میانگین زمان تولید داشبورد</p>
          </div>
          <div>
            <h3 className="text-6xl font-black text-purple-400">۹۹.۹٪</h3>
            <p className="text-gray-400 mt-3">دقت SQL بدون prompt engineering</p>
          </div>
          <div>
            <h3 className="text-6xl font-black text-emerald-400">۱۲۰k+</h3>
            <p className="text-gray-400 mt-3">پرامپت اجرا شده این ماه</p>
          </div>
        </div>
      </section>

      {/* فرم شروع پرامپت */}
      <section id="waitlist" className="py-32 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold">همین الان پرامپت بزنید</h2>
          <p className="mt-6 text-xl text-gray-400">بتا خصوصی — فقط ۱۰۰۰ نفر اول</p>
          
          <form onSubmit={handleSubmit} className="mt-10 flex flex-col sm:flex-row-reverse gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="you@company.com" 
              dir="ltr" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-6 py-4 bg-gray-900 border border-gray-700 rounded-2xl text-left focus:outline-none focus:border-white/50"
            />
            <button 
              type="submit" 
              className="px-12 py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-100 transition hover:scale-105"
            >
              شروع پرامپت
            </button>
          </form>
        </div>
      </section>

      <footer className="py-12 text-center text-gray-600 text-sm">
        © ۱۴۰۴ پرامپتِک – هوش تجاری نسل جدید، فقط با یک پرامپت
      </footer>
    </div>
  );
}
