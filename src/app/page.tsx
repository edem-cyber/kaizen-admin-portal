"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { HeroSlider } from "@/components/layout/hero-slider";
import { Button as MovingBorderButton } from "@/components/ui/moving-border";
import {
  ArrowUpRight,
  FileText,
  CheckCircle,
  BarChart3,
  TrendingUp,
  Shield,
  Building2,
  ChevronDown,
} from "lucide-react";

function GrainOverlay() {
  return (
    <div className="grain-overlay">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </div>
  );
}

function MeshBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#FAF8FF] overflow-hidden">
      {/* Moving Blobs - Violet/Purple */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full animate-blob pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/15 blur-[100px] rounded-full animate-blob animation-delay-2000 pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-primary/5 blur-[150px] rounded-full animate-blob animation-delay-4000 pointer-events-none" />

      {/* Subtle radial center light */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#FAF8FF_70%)] opacity-80" />
    </div>
  );
}




function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Is KaizenAdmin free?",
      answer: "KaizenAdmin offers a free tier for small teams to get started. For larger organizations with advanced features like multi-level approvals, custom workflows, and priority support, we offer flexible pricing plans. Contact us to learn more about our enterprise solutions.",
    },
    {
      question: "Can I use KaizenAdmin as a solo business owner?",
      answer: "Absolutely! KaizenAdmin is designed to scale with your business. Solo business owners can use it to track expenses, manage vendor relationships, and maintain records. As your business grows, you can easily add team members and implement approval workflows.",
    },
    {
      question: "Is KaizenAdmin for large companies?",
      answer: "Yes, KaizenAdmin is built to handle the needs of large enterprises. We support multi-level approval workflows, role-based access control, budget management across departments, and integration with existing ERP systems. Our enterprise plans include dedicated support and custom configurations.",
    },
    {
      question: "How much does KaizenAdmin cost?",
      answer: "Pricing depends on your team size and feature requirements. We offer a free tier for small teams, with paid plans starting at competitive rates. Enterprise pricing is customized based on your specific needs. Schedule a demo to get a personalized quote for your organization.",
    },
    {
      question: "Do I need to pay for training?",
      answer: "No, training is included with all paid plans. We provide comprehensive onboarding, video tutorials, documentation, and email support. Enterprise customers receive dedicated training sessions and priority support to ensure your team is up and running quickly.",
    },
  ];

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-0">
      {faqs.map((faq, index) => (
        <div key={index} className="border-b border-black/5">
          <button
            onClick={() => toggle(index)}
            className="w-full flex items-center justify-between py-5 text-left hover:bg-black/2 transition-colors group"
          >
            <span className="text-base font-semibold text-black pr-8">{faq.question}</span>
            <ChevronDown
              className={`w-5 h-5 text-[#4A4A4A] shrink-0 transition-transform duration-200 ${openIndex === index ? "rotate-180" : ""
                }`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
          >
            <div className="pb-5 text-sm text-[#4A4A4A] leading-relaxed">
              {faq.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/admin");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show navbar when at top or scrolling up
      if (currentScrollY < 100) {
        setIsNavbarVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide navbar
        setIsNavbarVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show navbar
        setIsNavbarVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white relative overflow-hidden flex flex-col selection:bg-primary/20 selection:text-primary">
      <MeshBackground />
      <GrainOverlay />
      <div className="fixed inset-0 grid-background -z-10" />

      <PublicNavbar isVisible={isNavbarVisible} />

      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
        <HeroSlider />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center mt-20">
          <h1 className="text-4xl md:text-[4.5rem] lg:text-[5.5rem] font-bold tracking-tight text-black leading-[0.95] text-balance mb-8">
            KaizenAdmin <br className="hidden md:block" /> management <br className="hidden md:block" /> that just works.
          </h1>
          <p className="mt-8 text-lg md:text-xl text-[#4A4A4A] max-w-2xl mx-auto font-medium leading-relaxed">
            KaizenAdmin makes it easier for you and your employees to run your commerce business in a single place.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link href="/signup">
              <MovingBorderButton
                borderRadius="9999px"
                containerClassName="h-14 w-auto min-w-[12rem] shadow-xl shadow-primary/10"
                className="px-10 text-lg"
              >
                Start for free
              </MovingBorderButton>
            </Link>
            <Link href="/contact">
              <button className="group bg-[#2C31CD]/90 text-white font-bold rounded-full px-10 h-14 text-lg border-0 transition-all flex items-center gap-2 cursor-pointer">
                Schedule a demo
                <div className="relative w-5 h-5 overflow-hidden">
                  <ArrowUpRight className="w-5 h-5 absolute inset-0 transition-all duration-300 group-hover:translate-x-full group-hover:-translate-y-full group-hover:opacity-0" />
                  <ArrowUpRight className="w-5 h-5 absolute inset-0 transition-all duration-300 -translate-x-full translate-y-full group-hover:translate-x-0 group-hover:translate-y-0 opacity-0 group-hover:opacity-100" />
                </div>
              </button>
            </Link>
          </div>
        </div>

        {/* Product Showcase */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 mt-16 scale-75 md:scale-100 transition-all duration-1000 delay-300">
          <div className="relative">
            <div className="overflow-hidden aspect-16/10 bg-transparent">
              <Image
                src="/showcase.png"
                alt="KaizenAdmin Dashboard"
                width={1600}
                height={1200}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            {/* Blending Gradient for mockup only */}
            <div className="absolute inset-x-0 bottom-0 h-64 bg-linear-to-t from-white via-white/80 to-transparent pointer-events-none z-20" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 min-h-screen flex flex-col justify-center">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-3">
            Your complete kaizenAdmin operating system.
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-black mb-2">KaizenAdmin Management</h3>
                <p className="text-sm text-[#4A4A4A] leading-relaxed">
                  Create, track, and manage kaizenAdmins through their entire lifecycle with real-time status updates. Support for drafts, submissions, revisions, and comprehensive audit trails.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-black mb-2">Approval Workflows</h3>
                <p className="text-sm text-[#4A4A4A] leading-relaxed">
                  Configurable multi-level approval chains with parallel and sequential approvals for seamless processing. Set custom rules, delegate approvals, and track every step in real-time.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-black mb-2">Budget Tracking</h3>
                <p className="text-sm text-[#4A4A4A] leading-relaxed">
                  Real-time budget monitoring, utilization reports, and forecasting to keep spending under control. Set budget limits, track allocations, and receive alerts when approaching thresholds.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-black mb-2">Vendor Management</h3>
                <p className="text-sm text-[#4A4A4A] leading-relaxed">
                  Manage vendor relationships, track performance metrics, and maintain preferred vendor lists. Store contact information, payment terms, and historical transaction data all in one place.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-black mb-2">Analytics & Reporting</h3>
                <p className="text-sm text-[#4A4A4A] leading-relaxed">
                  Comprehensive analytics with export capabilities to track spending trends and approval times. Generate custom reports, visualize data with charts, and export to Excel or PDF formats.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-black mb-2">Security & Access Control</h3>
                <p className="text-sm text-[#4A4A4A] leading-relaxed">
                  Role-based permissions, audit logs, and enterprise-grade security for complete control. Define user roles, restrict access by department or budget, and maintain detailed activity logs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-4">
              Frequently Asked
              <br />
              Questions
            </h2>
          </div>

          <div className="space-y-0">
            <FAQAccordion />
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
