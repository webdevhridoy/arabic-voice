export type Lang = "en" | "ar";

export const translations = {
  en: {
    demoText: "This is an example of converting Arabic text to a natural, human-like voice.",
    nav: {
      voices: "Voices",
      features: "Features",
      pricing: "Pricing",
      signIn: "Sign In",
      startNow: "Start Now",
    },
    hero: {
      badge: "The New Generation of Voice AI",
      headline1: "Turn Arabic Text",
      headline2: "Into Natural Voice with AI",
      headline3: "in Seconds",
      subtext:
        "Create realistic Arabic speech instantly. Perfect for creators, educators, and professionals.",
      ctaPrimary: "Generate Voice Free",
      ctaSecondary: "Discover How It Works",
      cardLabel: "Live Preview",
      cardCta: "Try Now",
    },
    trust: [
      "Optimized for Arabic Language",
      "Natural AI Voices",
      "Download in Seconds",
      "Built for Content Creators",
    ],
    features: {
      title: "Platform Features",
      subtitle: "Everything you need to create professional Arabic voiceovers.",
      items: [
        {
          title: "Instant Arabic Voice Generation",
          desc: "Convert your text to speech in real-time — no waiting for file processing.",
        },
        {
          title: "High Quality Natural Voices",
          desc: "Advanced AI models trained specifically on Arabic phonetics for accurate, human-like pronunciation.",
        },
        {
          title: "Instant Audio Download",
          desc: "Download your created audio clips in high-quality MP3 directly to your device.",
        },
        {
          title: "Built for Arabic Content Creators",
          desc: "Designed for developers, educators, and content creators on social platforms.",
        },
      ],
    },
    howItWorks: {
      title: "How It Works?",
      subtitle: "Super simple. Amazing results.",
      steps: [
        {
          label: "Paste Arabic Text",
          desc: "Place the text you want to convert directly in our editor.",
        },
        {
          label: "Generate Voice Instantly",
          desc: "AI generates clear, pure audio in just seconds.",
        },
        {
          label: "Listen or Download",
          desc: "Listen in the browser or download as an MP3 file.",
        },
      ],
    },
    voices: {
      badge: "Studio Quality",
      title: "Meet Our Voices",
      subtitle: "10 distinct AI voices. Pick the perfect tone for your content.",
      male: "Male",
      female: "Female",
      mostUsed: "Most Popular",
      ali: {
        name: "Ali (علي)",
        style: "Warm & Documentary",
        desc: "Perfect for storytelling, documentaries, and long-form content that needs a warm, engaging tone.",
      },
      omar: {
        name: "Omar (عمر)",
        style: "Professional & Formal",
        desc: "Commanding and clear — ideal for news broadcasts, corporate presentations, and official announcements.",
      },
      khalid: {
        name: "Khalid (خالد)",
        style: "Confident & Energetic",
        desc: "High-energy delivery perfect for ads, social media promos, and motivational content.",
      },
      ziad: {
        name: "Ziad (زياد)",
        style: "Deep & Authoritative",
        desc: "A strong, serious voice suited for political commentary, drama narration, and premium branding.",
      },
      hassan: {
        name: "Hassan (حسن)",
        style: "Smooth & Conversational",
        desc: "Natural and relaxed tone — great for podcasts, explainer videos, and casual educational content.",
      },
      tariq: {
        name: "Tariq (طارق)",
        style: "Punchy & Commercial",
        desc: "Sharp and direct — the go-to voice for short-form ads, trailers, and high-impact intros.",
      },
      maya: {
        name: "Maya (مايا)",
        style: "Clear & Lively",
        desc: "Excellent word clarity. Ideal for e-learning, ads, and short, energetic videos.",
      },
      layla: {
        name: "Layla (ليلى)",
        style: "Warm & Professional",
        desc: "A refined, professional female voice — excellent for corporate narration and premium brand content.",
      },
      nour: {
        name: "Nour (نور)",
        style: "Bright & Youthful",
        desc: "Vibrant and energetic — perfect for youth-oriented content, lifestyle brands, and social videos.",
      },
      sara: {
        name: "Sara (سارة)",
        style: "Calm & Educational",
        desc: "Soothing and steady — ideal for meditation guides, tutorials, and children's educational audio.",
      },
    },
    useCases: {
      title: "Who Uses صوتي?",
      chips: [
        "Content Creators (YouTube)",
        "Teachers & Trainers",
        "Bloggers & Journalists",
        "Social Media Managers",
      ],
    },
    pricing: {
      title: "Simple & Transparent Pricing",
      subtitle: "Start free, upgrade when you need to scale.",
      plans: [
        {
          id: "free",
          name: "Free",
          price: "$0",
          period: "/forever",
          features: [
            "5,000 characters lifetime",
            "All Arabic dialects",
            "All voices included",
            "No credit card required",
          ],
          cta: "Get Started",
          popular: false,
        },
        {
          id: "starter",
          name: "Starter",
          price: "$4.99",
          period: "/month",
          features: [
            "100,000 characters / month",
            "~120 minutes of audio",
            "Standard priority generation",
            "Commercial usage rights",
          ],
          cta: "Subscribe Now",
          popular: false,
        },
        {
          id: "pro",
          name: "Pro",
          price: "$9.99",
          period: "/month",
          features: [
            "300,000 characters / month",
            "~360 minutes of audio",
            "Top-priority generation",
            "All premium voices included",
          ],
          cta: "Subscribe Now",
          badge: "Most Popular",
          popular: true,
        },
        {
          id: "power",
          name: "Power",
          price: "$19.99",
          period: "/month",
          features: [
            "1,000,000 characters / month",
            "~1,200 minutes of audio",
            "Top-priority generation",
            "Dedicated support",
          ],
          cta: "Subscribe Now",
          badge: "Best Value",
          popular: false,
        }
      ]
    },
    cta: {
      title: "Start Producing Arabic Audio Content Today",
      subtitle:
        "Join creators who elevate their projects through AI voice generation that reflects the highest professionalism.",
      primary: "Create Your Account",
      secondary: "Try Free",
    },
    faq: {
      title: "Frequently Asked Questions",
      subtitle: "Got questions? We've got answers.",
      items: [
        {
          q: "What is Sawti?",
          a: "Sawti is a premium Arabic Text to Speech platform powered by advanced AI models, designed to convert written Arabic into highly natural, human-like voiceovers in seconds."
        },
        {
          q: "Can I download the generated audio?",
          a: "Yes! You can download high-quality MP3 audio files directly to your device and use them in your videos, podcasts, presentations, or educational content."
        },
        {
          q: "Which dialects do you support?",
          a: "We support Modern Standard Arabic (MSA) as well as various regional dialects. You can choose from different voice options and adjust playback speed to fit your project."
        }
      ]
    },
    footer: {
      product: "Product",
      pricing: "Pricing",
      privacy: "Privacy",
      terms: "Terms",
      contact: "Contact Us",
      copyright: `© ${new Date().getFullYear()} صوتي. All rights reserved.`,
    },
  },

  ar: {
    demoText: "مرحباً، هذا مثال على تحويل النص العربي إلى صوت طبيعي.",
    nav: {
      voices: "الأصوات",
      features: "المميزات",
      pricing: "الأسعار",
      signIn: "تسجيل الدخول",
      startNow: "ابدأ الآن",
    },
    hero: {
      badge: "الجيل الجديد من الذكاء الصوتي",
      headline1: "حوّل النص العربي",
      headline2: "إلى صوت طبيعي في ثوانٍ",
      headline3: "",
      subtext:
        "الصق أي نص عربي وقم بتوليد صوت بشري واضح وطبيعي، مدعوم بأحدث تقنيات الذكاء الاصطناعي في لحظات.",
      ctaPrimary: "توليد الصوت مجاناً",
      ctaSecondary: "اكتشف كيف يعمل",
      cardLabel: "معاينة حية",
      cardCta: "جرب الآن",
    },
    trust: [
      "تجربة مخصصة للغة العربية",
      "أصوات طبيعية بالذكاء الاصطناعي",
      "تحميل في ثوانٍ",
      "صُمم لصناع المحتوى",
    ],
    features: {
      title: "مميزات المنصة",
      subtitle: "كل ما تحتاجه لإنشاء تعليق صوتي عربي احترافي.",
      items: [
        {
          title: "توليد فوري للصوت العربي",
          desc: "حول نصوصك إلى كلام في الوقت الفعلي، دون الحاجة للانتظار لمعالجة الملفات.",
        },
        {
          title: "أصوات طبيعية عالية الجودة",
          desc: "نماذج ذكاء اصطناعي متطورة مدربة خصيصاً على الصوتيات العربية لنطق دقيق وطبيعي كالبشر.",
        },
        {
          title: "تحميل الصوت فوراً",
          desc: "حمل المقاطع الصوتية التي قمت بإنشائها بجودة MP3 العالية مباشرة إلى جهازك.",
        },
        {
          title: "صُمم لصناع المحتوى العربي",
          desc: "مصمم خصيصاً لتلبية احتياجات المطورين، والمعلمين، وصناع المحتوى على منصات التواصل.",
        },
      ],
    },
    howItWorks: {
      title: "كيف يعمل؟",
      subtitle: "بسيط جداً. نتائج مذهلة.",
      steps: [
        {
          label: "الصق النص العربي",
          desc: "ضع النص الذي تريد تحويله مباشرة في المحرر الخاص بنا.",
        },
        {
          label: "توليد الصوت فوراً",
          desc: "يقوم الذكاء الاصطناعي بتوليد صوت نقي في ثوانٍ معدودة.",
        },
        {
          label: "استمع أو حمل",
          desc: "استمع للصوت من المتصفح أو قم بتحميله كملف MP3.",
        },
      ],
    },
    voices: {
      badge: "جودة استوديو",
      title: "تعرف على أصواتنا",
      subtitle: "10 أصوات ذكاء اصطناعي متميزة. اختر النبرة المثالية لمحتواك.",
      male: "ذكر",
      female: "أنثى",
      mostUsed: "الأكثر استخداماً",
      ali: {
        name: "علي (Ali)",
        style: "دافئ ووثائقي",
        desc: "مثالي لسرد القصص، والأفلام الوثائقية، ومقاطع الفيديو الطويلة ذات النبرة الدافئة الجذابة.",
      },
      omar: {
        name: "عمر (Omar)",
        style: "احترافي ورسمي",
        desc: "صوت قيادي وواضح — مثالي لنشرات الأخبار والعروض التقديمية الرسمية وإعلانات الشركات.",
      },
      khalid: {
        name: "خالد (Khalid)",
        style: "واثق وحيوي",
        desc: "أداء عالي الطاقة مثالي للإعلانات ومقاطع السوشيال ميديا والمحتوى التحفيزي.",
      },
      ziad: {
        name: "زياد (Ziad)",
        style: "عميق وموثوق",
        desc: "صوت قوي وجدي مناسب للتعليق السياسي وسرد الدراما والعلامات التجارية المميزة.",
      },
      hassan: {
        name: "حسن (Hassan)",
        style: "سلس وتحادثي",
        desc: "نبرة طبيعية ومريحة — رائعة للبودكاست ومقاطع الشرح والمحتوى التعليمي غير الرسمي.",
      },
      tariq: {
        name: "طارق (Tariq)",
        style: "تجاري ومؤثر",
        desc: "حاد ومباشر — الصوت الأمثل للإعلانات القصيرة والمقدمات عالية التأثير والمقاطع الترويجية.",
      },
      maya: {
        name: "مايا (Maya)",
        style: "واضح وحيوي",
        desc: "وضوح ممتاز للكلمات. مثالي للمحتوى التعليمي والإعلانات ومقاطع الفيديو القصيرة الحيوية.",
      },
      layla: {
        name: "ليلى (Layla)",
        style: "دافئ واحترافي",
        desc: "صوت أنثوي راقٍ واحترافي — ممتاز لتعليق الشركات ومحتوى العلامات التجارية المتميزة.",
      },
      nour: {
        name: "نور (Nour)",
        style: "مشرق وشبابي",
        desc: "مشرق وشبابي — مثالي للمحتوى الموجه للشباب وماركات أسلوب الحياة والمقاطع الاجتماعية.",
      },
      sara: {
        name: "سارة (Sara)",
        style: "هادئ وتعليمي",
        desc: "مهدئ وثابت — مثالي لأدلة التأمل والشروحات والمحتوى التعليمي للأطفال.",
      },
    },
    useCases: {
      title: "من يستخدم منصة صوتي؟",
      chips: [
        "صناع المحتوى (اليوتيوب)",
        "المعلمون والمدربون",
        "المدونون والصحفيون",
        "مديرو حسابات السوشيال ميديا",
      ],
    },
    pricing: {
      title: "أسعار بسيطة وشفافة",
      subtitle: "اختر الخطة المناسبة لاحتياجاتك واستمتع بأفضل جودة صوتية.",
      plans: [
        {
          id: "free",
          name: "مجاني",
          price: "$0",
          period: "/للأبد",
          features: [
            "5,000 حرف مدى الحياة",
            "جميع اللهجات العربية",
            "جميع الأصوات متاحة",
            "بدون بطاقة ائتمانية",
          ],
          cta: "ابدأ مجاناً",
          popular: false,
        },
        {
          id: "starter",
          name: "المبتدئ",
          price: "$4.99",
          period: "/شهر",
          features: [
            "100,000 حرف شهرياً",
            "~120 دقيقة صوتية",
            "أولوية عادية للتوليد",
            "حقوق الاستخدام التجاري",
          ],
          cta: "اشترك الآن",
          popular: false,
        },
        {
          id: "pro",
          name: "المحترف",
          price: "$9.99",
          period: "/شهر",
          features: [
            "300,000 حرف شهرياً",
            "~360 دقيقة صوتية",
            "أولوية قصوى للتوليد",
            "وصول لجميع الأصوات",
          ],
          cta: "اشترك الآن",
          badge: "الأكثر شعبية",
          popular: true,
        },
        {
          id: "power",
          name: "باور",
          price: "$19.99",
          period: "/شهر",
          features: [
            "1,000,000 حرف شهرياً",
            "~1,200 دقيقة صوتية",
            "أولوية قصوى للتوليد",
            "دعم فني مخصص",
          ],
          cta: "اشترك الآن",
          badge: "الأوفر",
          popular: false,
        }
      ]
    },
    cta: {
      title: "ابدأ في إنتاج المحتوى الصوتي العربي اليوم",
      subtitle:
        "انضم إلى صناع المحتوى الذين يرتقون بمشاريعهم من خلال توليد صوت يعكس الاحترافية العالية.",
      primary: "أنشئ حسابك",
      secondary: "جرب مجاناً",
    },
    faq: {
      title: "الأسئلة الشائعة",
      subtitle: "لديك أسئلة؟ لدينا الإجابات.",
      items: [
        {
          q: "ما هو صوتي؟",
          a: "صوتي هي منصة متطورة لتحويل النص العربي إلى صوت طبيعي باستخدام الذكاء الاصطناعي، تمكنك من تحويل النصوص المكتوبة إلى تعليقات صوتية شبيهة بالبشر في ثوانٍ معدودة."
        },
        {
          q: "هل يمكنني تحميل الصوت المولد؟",
          a: "نعم! يمكنك تحميل ملفات صوتية بصيغة MP3 عالية الجودة مباشرة إلى جهازك واستخدمها في مقاطع الفيديو، أو البودكاست، أو العروض التقديمية، أو المحتوى التعليمي."
        },
        {
          q: "ما هي اللهجات التي تدعمها المنصة؟",
          a: "نحن ندعم الفصحى الحديثة بالإضافة إلى مختلف اللهجات العربية الإقليمية. يمكنك الاختيار من بين خيارات أصوات متعددة وضبط سرعة التشغيل لتناسب مشروعك."
        }
      ]
    },
    footer: {
      product: "المنتج",
      pricing: "الأسعار",
      privacy: "الخصوصية",
      terms: "الشروط",
      contact: "اتصل بنا",
      copyright: `© ${new Date().getFullYear()} صوتي. جميع الحقوق محفوظة.`,
    },
  },
} as const;

export type Translations = typeof translations["en"];
