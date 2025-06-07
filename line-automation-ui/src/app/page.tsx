'use client';

import Link from 'next/link';
import { UserPlusIcon, UserGroupIcon, UsersIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import PageContainer from './components/layout/PageContainer';
import Card from './components/ui/Card';

const features = [
  {
    name: 'สมัครสมาชิก LINE',
    description: 'สร้างบัญชี LINE ใหม่เพื่อใช้ในระบบ Automation',
    href: '/register',
    icon: UserPlusIcon,
    color: 'bg-blue-500',
  },
  {
    name: 'แอดเพื่อน',
    description: 'เพิ่มเพื่อนจากเบอร์โทรศัพท์หรือรายการเบอร์',
    href: '/add-friends',
    icon: UsersIcon,
    color: 'bg-green-500',
  },
  {
    name: 'สร้างกลุ่ม LINE',
    description: 'สร้างและจัดการกลุ่ม LINE สำหรับการส่งข้อความ',
    href: '/create-group',
    icon: UserGroupIcon,
    color: 'bg-yellow-500',
  },
  {
    name: 'ส่งข้อความ',
    description: 'ส่งข้อความไปยังกลุ่ม LINE ที่เลือก',
    href: '/send-message',
    icon: ChatBubbleLeftRightIcon,
    color: 'bg-purple-500',
  },
];

export default function Home() {
  return (
    <PageContainer
      title="LINE Automation System"
      subtitle="ระบบจัดการบัญชีไลน์อัตโนมัติสำหรับการสมัครสมาชิก เพิ่มเพื่อน สร้างกลุ่ม และส่งข้อความ"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-8">
        {features.map((feature) => (
          <Link key={feature.name} href={feature.href}>
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:translate-y-[-4px]">
              <div className="flex flex-col items-center text-center">
                <div className={`${feature.color} text-white p-3 rounded-full mb-4`}>
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">{feature.name}</h3>
                <p className="mt-2 text-sm text-gray-500">{feature.description}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
