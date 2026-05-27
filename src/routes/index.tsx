{/* 8. Pricing Section */}
      <section id="pricing" className="py-20 md:py-28 border-t border-border bg-[#0A0A0F] relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[400px] bg-amber-500/[0.03] rounded-full blur-[120px] pointer-events-none"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] mb-2 block font-mono">
              خطط الاشتراك والأسعار
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-display">
              باقات مرنة ومصممة خصيصاً للعمل القانوني
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed text-right md:text-center">
              ابدأ بفترة تجريبية مجانية بالكامل لمدة ٧ أيام، واكتشف كيف يسهّل نظام قضيتي أعمالك، ثم اختر الباقة الملائمة لطبيعة عملك القانوني وسعة مكتبك.
            </p>

            {/* Toggle Billing Period */}
            <div className="inline-flex items-center gap-1 rounded-2xl bg-secondary p-1 border border-slate-900 mt-8">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`rounded-xl px-5 py-2 text-xs font-semibold transition-all ${billingPeriod === "monthly" ? "bg-[var(--gold)] text-black font-bold shadow-md" : "text-slate-400 hover:text-white"}`}
              >
                الدفع شهرياً
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`relative rounded-xl px-5 py-2 text-xs font-semibold transition-all ${billingPeriod === "yearly" ? "bg-[var(--gold)] text-black font-bold shadow-md" : "text-slate-400 hover:text-white"}`}
              >
                الدفع سنوياً
                <span className="absolute -top-6 -left-2 rounded-full bg-red-500 px-2 py-0.5 text-[8.5px] font-bold text-white tracking-tight animate-bounce">
                  الأكثر توفيرًا (شهرين مجاناً)
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mt-12">
            
            {/* 1. Free Plan */}
            <div className="rounded-3xl border border-slate-800 bg-[#0C101A]/60 p-6 flex flex-col justify-between shadow-lg relative text-right transition-all hover:border-slate-700">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-900/80 rounded-full px-2.5 py-1 inline-block mb-3">
                  البداية السريعة
                </span>
                <h3 className="text-lg font-bold text-white mb-1 font-display">الباقة المجانية (Free)</h3>
                <p className="text-xs text-slate-400 mb-6 font-sans leading-relaxed">
                  أنسب خيار للمحامين المبتدئين لتجربة البرنامج في قضايا محدودة.
                </p>

                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-3xl font-black text-white font-mono">٠</span>
                  <span className="text-xs text-slate-300">جنيه مصرى</span>
                  <span className="text-xs text-slate-500">/ للأبد</span>
                </div>

                <div className="border-t border-slate-900/60 pt-5 space-y-3">
                  <p className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">محتويات الباقة:</p>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>إدارة حتى <strong>٣ قضايا</strong> كحد أقصى</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span><strong>١٥ محادثة</strong> للمستشار الذكي شهرياً</span>
                    </li>
                    <li className="flex items-start gap-2 text-slate-500 line-through">
                      <X className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span>ربط ومزامنة Google Drive</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>لوحة تحكم مهام أساسية</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to="/signup"
                  className="w-full text-center flex items-center justify-center rounded-xl bg-slate-900 py-3 text-xs font-bold text-slate-200 border border-slate-800 hover:text-white hover:bg-slate-850 transition-all cursor-pointer"
                >
                  سجل مجاناً
                </Link>
              </div>
            </div>

            {/* 2. Basic Plan (The Highlighted Plan) */}
            <div className="rounded-3xl border-2 border-[var(--gold)] bg-[#0C1222] p-6 flex flex-col justify-between shadow-2xl relative text-right transition-all transform scale-[1.03] lg:scale-[1.05] z-10">
              <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--accent)] px-3 py-1 text-[9px] font-bold text-black border border-amber-600/20 shadow animate-pulse">
                الباقة الأكثر طلباً ⭐ الأكثر شعبية
              </span>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--gold)] bg-amber-500/10 rounded-full px-2.5 py-1 inline-block mb-3">
                  موصى للأفراد والشباب
                </span>
                <h3 className="text-lg font-bold text-white mb-1 font-display">الباقة الفردية للـمُحامي</h3>
                <p className="text-xs text-slate-300 mb-6 font-sans leading-relaxed">
                  مخصصة للمحامين الشباب أو المستقلين الذين يديرون كمّاً معتاداً من القضايا.
                </p>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-4xl font-black text-white font-mono">
                    {billingPeriod === "yearly" ? "١,٤٩٠" : "١٤٩"}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">جنيه مصرى</span>
                  <span className="text-xs text-slate-400">
                    / {billingPeriod === "yearly" ? "سنة" : "شهر"}
                  </span>
                </div>

                {billingPeriod === "yearly" && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1 text-[9px] text-red-400 font-bold mb-4 inline-block">
                    وفر شهرين كاملين (٢ شهر مجانًا!)
                  </div>
                )}

                <div className="border-t border-slate-800/80 pt-5 space-y-3">
                  <p className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">كل ما في المجانية بالإضافة إلى:</p>
                  <ul className="space-y-2.5 text-xs text-slate-200">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[var(--gold)] shrink-0 mt-0.5" />
                      <span>إدارة حتى <strong>٥٠ قضية نشطة</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[var(--gold)] shrink-0 mt-0.5" />
                      <span>جلسات وعملاء وجهات اتصال <strong>بلا حدود</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[var(--gold)] shrink-0 mt-0.5" />
                      <span><strong>١٠٠ طلب قانوني شهرياً</strong> بالمستشار الذكي</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[var(--gold)] shrink-0 mt-0.5" />
                      <span>ربط وحفظ مذكرات ومرفقات <strong>Google Drive</strong> مباشرة</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-[var(--gold)] shrink-0 mt-0.5" />
                      <span>المتابعة المالية والإشعارات وحساب الأقساط</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to="/signup"
                  className="w-full text-center flex items-center justify-center rounded-xl bg-gradient-to-r from-[var(--gold)] to-[var(--accent)] py-3.5 text-xs font-bold text-black hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  ابدأ التجربة والاشتراك
                </Link>
              </div>
            </div>

            {/* 3. Pro Plan */}
            <div className="rounded-3xl border border-slate-800 bg-[#0C101A]/60 p-6 flex flex-col justify-between shadow-lg relative text-right transition-all hover:border-slate-700">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 rounded-full px-2.5 py-1 inline-block mb-3">
                  للنشاط المكثف والـ AI
                </span>
                <h3 className="text-lg font-bold text-white mb-1 font-display">باقة المحامي المحترف (Pro)</h3>
                <p className="text-xs text-slate-400 mb-6 font-sans leading-relaxed">
                  الخيار الأفضل للنشاط المكثف والاعتماد الدائم على الذكاء الاصطناعي في صياغة وتلخيص العقود.
                </p>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-3xl font-black text-white font-mono">
                    {billingPeriod === "yearly" ? "٢,٩٩٠" : "٢٩٩"}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">جنيه مصرى</span>
                  <span className="text-xs text-slate-400">
                    / {billingPeriod === "yearly" ? "سنة" : "شهر"}
                  </span>
                </div>

                {billingPeriod === "yearly" && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1 text-[9px] text-red-400 font-bold mb-4 inline-block">
                    وفر شهرين كاملين تلقائياً (توفير ٢ شهر)
                  </div>
                )}

                <div className="border-t border-slate-900/60 pt-5 space-y-3">
                  <p className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">كل ما في الأساسية بالإضافة إلى:</p>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>قضايا وعملاء وحسابات مالية <strong>بلا حدود</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>٦٠٠ طلب شهرياً</strong> تشمل التحليل والتوليد العميق</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>ربط متكامل لـ Google Drive ومرئي ومتحكم به بالكامل</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>دعم فني عربي ذو أولوية فائقة</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to="/signup"
                  className="w-full text-center flex items-center justify-center rounded-xl bg-slate-900 py-3 text-xs font-bold text-slate-200 border border-slate-850 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  اشترك في باقة المحترف
                </Link>
              </div>
            </div>

            {/* 4. Enterprise Plan */}
            <div className="rounded-3xl border border-slate-800 bg-[#0C101A]/60 p-6 flex flex-col justify-between shadow-lg relative text-right transition-all hover:border-slate-700">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 rounded-full px-2.5 py-1 inline-block mb-3">
                  للمكاتب الكبيرة والشركات
                </span>
                <h3 className="text-lg font-bold text-white mb-1 font-display">باقة المكاتب والشركات القانونية</h3>
                <p className="text-xs text-slate-400 mb-6 font-sans leading-relaxed">
                  باقة مخصصة للمكاتب القانونية الكبيرة التي تحتوي على عدة محامين ومستشارين يتشاركون نفس النظام.
                </p>

                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-3xl font-black text-white font-mono">١٩٩</span>
                  <span className="text-xs font-semibold text-slate-300">جنيه مصرى</span>
                  <span className="text-xs text-slate-500">/ للمحامي نشط / شهر</span>
                </div>

                <div className="border-t border-slate-900/60 pt-5 space-y-3">
                  <p className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">خصائص باقة الشركات:</p>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span><strong>لوحة تحكم رئيسية</strong> لصاحب المكتب يرى فيها قضايا ومواعيد كل المحامين</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>تكامل المستشار الذكي <strong>لكل مستخدم فرعي</strong> بشكل مستقل</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>توزيع المهام والقضايا ومراجعة المخرجات مركزياً</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>مساحة تخزين شاملة ومدير حسابات خاص</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <a
                  href="mailto:contact@qadeyti.com?subject=طلب باقة الشركات والمكاتب القانونية في قضيتي"
                  className="w-full text-center flex items-center justify-center rounded-xl bg-blue-900/20 py-3 text-xs font-bold text-blue-400 border border-blue-900/30 hover:bg-blue-900/35 hover:text-blue-300 transition-all cursor-pointer"
                >
                  اطلب باقة الشركات
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>