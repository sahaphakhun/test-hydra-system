'use client';

import Link from 'next/link';
import { 
  UserPlusIcon, 
  UserGroupIcon, 
  UsersIcon, 
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import PageContainer from './components/layout/PageContainer';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/Card';

const features = [
  {
    name: 'สมัครสมาชิก LINE',
    description: 'สร้างบัญชี LINE ใหม่เพื่อใช้ในระบบ Automation อย่างง่ายดาย',
    href: '/register',
    icon: UserPlusIcon,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    status: 'พร้อมใช้งาน',
  },
  {
    name: 'แอดเพื่อน',
    description: 'เพิ่มเพื่อนจากเบอร์โทรศัพท์หรือรายการเบอร์ได้อย่างรวดเร็ว',
    href: '/add-friends',
    icon: UsersIcon,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    status: 'พร้อมใช้งาน',
  },
  {
    name: 'สร้างกลุ่ม LINE',
    description: 'สร้างและจัดการกลุ่ม LINE สำหรับการส่งข้อความแบบกลุ่ม',
    href: '/create-group',
    icon: UserGroupIcon,
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    status: 'พร้อมใช้งาน',
  },
  {
    name: 'ส่งข้อความ',
    description: 'ส่งข้อความไปยังกลุ่ม LINE ที่เลือกได้อย่างมีประสิทธิภาพ',
    href: '/send-message',
    icon: ChatBubbleLeftRightIcon,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    status: 'พร้อมใช้งาน',
  },
];

const stats = [
  { name: 'บัญชีที่ลงทะเบียน', value: '0', description: 'บัญชี LINE ที่พร้อมใช้งาน' },
  { name: 'กลุ่มที่สร้าง', value: '0', description: 'กลุ่ม LINE ที่จัดการ' },
  { name: 'ข้อความที่ส่ง', value: '0', description: 'ข้อความที่ส่งสำเร็จ' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <PageContainer
        title="LINE Automation System"
        subtitle="ระบบจัดการบัญชี LINE อัตโนมัติที่ครบครัน สำหรับการสมัครสมาชิก เพิ่มเพื่อน สร้างกลุ่ม และส่งข้อความ"
      >
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
            <SparklesIcon className="h-4 w-4 mr-2" />
            ระบบใหม่ล่าสุด - เรียบง่าย ใช้งานง่าย
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-balance">
            จัดการ LINE ได้อย่าง
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {' '}อัตโนมัติ
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto text-balance">
            เครื่องมือที่ทรงพลังสำหรับการจัดการบัญชี LINE หลายบัญชี 
            ด้วยระบบที่เรียบง่ายและใช้งานง่าย
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat) => (
            <Card key={stat.name} variant="elevated" className="text-center">
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-lg font-medium text-gray-900 mb-1">{stat.name}</div>
                <div className="text-sm text-gray-600">{stat.description}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature) => (
            <Link key={feature.name} href={feature.href} className="group">
              <Card 
                interactive 
                className="h-full group-hover:shadow-xl transition-all duration-300"
              >
                <CardHeader>
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">{feature.name}</CardTitle>
                    <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${feature.bgColor} ${feature.textColor}`}>
                    <div className="w-1.5 h-1.5 bg-current rounded-full mr-2" />
                    {feature.status}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Getting Started Section */}
        <Card variant="elevated" className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-2xl text-center">เริ่มต้นใช้งาน</CardTitle>
            <CardDescription className="text-center text-lg">
              ทำตามขั้นตอนง่าย ๆ เพื่อเริ่มใช้งานระบบ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div key={feature.name} className="text-center">
                  <div className="relative">
                    <div className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-3`}>
                      {index + 1}
                    </div>
                    {index < features.length - 1 && (
                      <div className="hidden md:block absolute top-5 left-full w-full h-0.5 bg-gray-200 -translate-y-0.5" />
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{feature.name}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  );
}
