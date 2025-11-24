'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'reviewer';
}

export default function Layout({ children, role }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 토큰 확인 및 사용자 정보 가져오기
    fetch('/api/auth/verify')
      .then(res => {
        if (!res.ok) {
          router.push('/auth/login');
        }
        return res.json();
      })
      .then(data => {
        if (data.authenticated && data.role !== role) {
          // role이 맞지 않으면 홈으로 리다이렉트
          router.push('/');
        }
      })
      .catch(() => {
        router.push('/auth/login');
      });
  }, [router, role]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
  };

  const navItems =
    role === 'admin'
      ? [
          { href: '/admin/dashboard', label: '대시보드' },
          { href: '/admin/reviewers', label: '리뷰어 관리' },
          { href: '/admin/cafes', label: '카페 관리' },
          { href: '/admin/tasks', label: '작업 관리' },
          { href: '/admin/settlements', label: '정산 관리' },
        ]
      : [
          { href: '/reviewer/dashboard', label: '대시보드' },
          { href: '/reviewer/tasks', label: '내 작업' },
          { href: '/reviewer/mypage', label: '마이페이지' },
        ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">CAFELOGIC</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`${
                      pathname === item.href
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

