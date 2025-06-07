'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PaperAirplaneIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Textarea from '../components/ui/Textarea';
import { sendMessageToGroup } from '../services/api';
import { LineAccount, LineGroup } from '../types';

// กำหนด Schema สำหรับการตรวจสอบข้อมูลฟอร์ม
const messageFormSchema = z.object({
  message: z.string().min(1, 'กรุณาระบุข้อความที่ต้องการส่ง'),
});

type MessageFormValues = z.infer<typeof messageFormSchema>;

const SendMessagePage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<LineAccount | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<LineGroup | null>(null);
  const [accounts, setAccounts] = useState<LineAccount[]>([]);
  const [groups, setGroups] = useState<LineGroup[]>([]);
  const [sendSuccess, setSendSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
  });

  const onSubmit = async (data: MessageFormValues) => {
    if (!selectedAccount || !selectedGroup) return;
    
    setIsLoading(true);
    setSendSuccess(false);
    
    try {
      // เรียกใช้ API ส่งข้อความ
      await sendMessageToGroup(selectedAccount.id, selectedGroup.id, data.message);
      
      // แสดงผลสำเร็จ
      setSendSuccess(true);
      
      // รีเซ็ตฟอร์ม
      reset();
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการส่งข้อความ:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // กรองกลุ่มตามบัญชีที่เลือก
  const filteredGroups = selectedAccount
    ? groups.filter((group) => group.accountId === selectedAccount.id)
    : [];

  return (
    <PageContainer
      title="ส่งข้อความ"
      subtitle="ส่งข้อความไปยังกลุ่ม LINE ที่เลือก"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* คอลัมน์ซ้ายสำหรับเลือกบัญชีและกลุ่ม */}
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <h3 className="text-lg font-medium mb-4">1. เลือกบัญชี LINE</h3>
            {accounts.length > 0 ? (
              <div className="space-y-2">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedAccount?.id === account.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedAccount(account);
                      setSelectedGroup(null); // รีเซ็ตกลุ่มที่เลือกเมื่อเปลี่ยนบัญชี
                    }}
                  >
                    <div className="flex items-center">
                      <div className="flex-1">
                        <h4 className="font-medium">{account.displayName}</h4>
                        <p className="text-sm text-gray-500">{account.phoneNumber}</p>
                      </div>
                      {account.status === 'active' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          กำลังใช้งาน
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
                <p>คุณยังไม่มีบัญชี LINE ลงทะเบียนไว้</p>
                <Button
                  onClick={() => {
                    // นำทางไปยังหน้าสมัครสมาชิก
                    window.location.href = '/register';
                  }}
                  className="mt-2"
                >
                  สมัครบัญชีใหม่
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-medium mb-4">2. เลือกกลุ่ม LINE</h3>
            {selectedAccount ? (
              filteredGroups.length > 0 ? (
                <div className="space-y-2">
                  {filteredGroups.map((group) => (
                    <div
                      key={group.id}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedGroup?.id === group.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedGroup(group)}
                    >
                      <div className="flex items-center">
                        <div className="flex-1">
                          <h4 className="font-medium">{group.name}</h4>
                          <p className="text-sm text-gray-500">
                            สมาชิก {group.memberCount} คน
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
                  <p>ไม่มีกลุ่มในบัญชีนี้</p>
                  <Button
                    onClick={() => {
                      // นำทางไปยังหน้าสร้างกลุ่ม
                      window.location.href = '/create-group';
                    }}
                    className="mt-2"
                  >
                    สร้างกลุ่มใหม่
                  </Button>
                </div>
              )
            ) : (
              <p className="text-gray-500">โปรดเลือกบัญชี LINE ก่อน</p>
            )}
          </Card>
        </div>

        {/* คอลัมน์ขวาสำหรับส่งข้อความ */}
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-lg font-medium mb-4">3. เขียนและส่งข้อความ</h3>
            
            {selectedAccount && selectedGroup ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-md mb-4">
                  <p className="text-sm font-medium text-gray-700">
                    กำลังส่งข้อความจาก: <span className="text-blue-600">{selectedAccount.displayName}</span>
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    ไปยังกลุ่ม: <span className="text-blue-600">{selectedGroup.name}</span>
                  </p>
                </div>

                <Textarea
                  label="ข้อความ"
                  placeholder="พิมพ์ข้อความที่ต้องการส่งไปยังกลุ่ม"
                  rows={6}
                  fullWidth
                  {...register('message')}
                  error={errors.message?.message}
                />

                {sendSuccess && (
                  <div className="p-3 bg-green-50 text-green-700 rounded-md flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    <span>ส่งข้อความสำเร็จ!</span>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="flex items-center"
                  >
                    <PaperAirplaneIcon className="h-5 w-5 mr-1" />
                    ส่งข้อความ
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-gray-50 rounded-md text-center">
                <p className="text-gray-500">
                  โปรดเลือกบัญชีและกลุ่ม LINE ก่อนส่งข้อความ
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default SendMessagePage; 