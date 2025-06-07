'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { createLineGroup } from '../services/api';
import { LineAccount, LineGroup } from '../types';

// กำหนด Schema สำหรับการตรวจสอบข้อมูลฟอร์ม
const createGroupFormSchema = z.object({
  name: z.string().min(2, 'ชื่อกลุ่มต้องมีอย่างน้อย 2 ตัวอักษร'),
});

type CreateGroupFormValues = z.infer<typeof createGroupFormSchema>;

const CreateGroupPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<LineAccount | null>(null);
  const [accounts, setAccounts] = useState<LineAccount[]>([]);
  const [groups, setGroups] = useState<LineGroup[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupFormSchema),
  });

  const onSubmit = async (data: CreateGroupFormValues) => {
    if (!selectedAccount) return;
    
    setIsLoading(true);
    try {
      // เรียกใช้ API สร้างกลุ่ม
      const response = await createLineGroup(selectedAccount.id, data.name);
      
      // สร้างข้อมูลกลุ่มใหม่สำหรับแสดงใน UI
      const newGroup: LineGroup = {
        id: Date.now().toString(), // ในกรณีจริงจะได้ ID จาก response
        name: data.name,
        accountId: selectedAccount.id,
        memberCount: 1, // เริ่มต้นมีสมาชิก 1 คน (ตัวเอง)
        createdAt: new Date().toISOString(),
      };
      
      setGroups([...groups, newGroup]);
      setIsModalOpen(false);
      reset();
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการสร้างกลุ่ม:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer
      title="สร้างกลุ่ม LINE"
      subtitle="สร้างและจัดการกลุ่ม LINE สำหรับการส่งข้อความ"
    >
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => {
            if (accounts.length > 0) {
              setIsModalOpen(true);
            } else {
              // แจ้งเตือนว่าต้องมีบัญชี LINE ก่อน
              alert('คุณต้องมีบัญชี LINE อย่างน้อย 1 บัญชีก่อนสร้างกลุ่ม');
            }
          }}
          className="flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          สร้างกลุ่มใหม่
        </Button>
      </div>

      {/* เลือกบัญชี LINE เพื่อดูกลุ่ม */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">เลือกบัญชีเพื่อดูกลุ่ม</h3>
        <div className="flex flex-wrap gap-2">
          {accounts.length > 0 ? (
            accounts.map((account) => (
              <button
                key={account.id}
                className={`px-4 py-2 border rounded-md transition-colors ${
                  selectedAccount?.id === account.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedAccount(account)}
              >
                {account.displayName}
              </button>
            ))
          ) : (
            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md w-full">
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
        </div>
      </div>

      {/* แสดงรายการกลุ่ม */}
      {selectedAccount ? (
        <>
          <h3 className="text-lg font-medium mb-3">กลุ่ม LINE ของบัญชี {selectedAccount.displayName}</h3>
          {groups.filter(group => group.accountId === selectedAccount.id).length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groups
                .filter(group => group.accountId === selectedAccount.id)
                .map((group) => (
                  <Card key={group.id} className="hover:shadow-md transition-shadow">
                    <div className="flex flex-col">
                      <div className="flex items-start">
                        <div className="p-2 bg-blue-100 rounded-md mr-3">
                          <UserGroupIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{group.name}</h3>
                          <p className="text-gray-500 text-sm">สมาชิก {group.memberCount} คน</p>
                          <p className="text-gray-400 text-xs mt-1">
                            สร้างเมื่อ {new Date(group.createdAt).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <p className="text-gray-500">ยังไม่มีกลุ่มในบัญชีนี้</p>
              <Button onClick={() => setIsModalOpen(true)} className="mt-4">
                สร้างกลุ่มใหม่
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-gray-500">เลือกบัญชี LINE เพื่อดูกลุ่ม</p>
        </div>
      )}

      {/* Modal สำหรับสร้างกลุ่มใหม่ */}
      <Modal
        open={isModalOpen}
        onClose={() => !isLoading && setIsModalOpen(false)}
        title="สร้างกลุ่ม LINE ใหม่"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">เลือกบัญชี LINE ที่ต้องการใช้สร้างกลุ่ม</p>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedAccount?.id === account.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedAccount(account)}
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
          </div>

          <Input
            label="ชื่อกลุ่ม"
            placeholder="ชื่อสำหรับกลุ่ม LINE ใหม่"
            fullWidth
            {...register('name')}
            error={errors.name?.message}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={!selectedAccount}
            >
              สร้างกลุ่ม
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};

export default CreateGroupPage; 