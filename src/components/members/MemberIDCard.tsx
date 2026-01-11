import React, { useRef } from 'react';
import { Member } from '@/types';
import { CrossIcon } from '@/components/CrossIcon';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import Barcode from 'react-barcode';

interface MemberIDCardProps {
  member: Member;
}

export const MemberIDCard: React.FC<MemberIDCardProps> = ({ member }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ID Card - ${member.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Inter:wght@400;500;600&display=swap');
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: 'Inter', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
            }
            .card {
              width: 340px;
              padding: 24px;
              background: linear-gradient(135deg, #1a2942 0%, #0f1829 100%);
              border-radius: 16px;
              color: white;
              box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            }
            .header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 20px;
              padding-bottom: 16px;
              border-bottom: 1px solid rgba(212, 175, 55, 0.3);
            }
            .cross {
              width: 32px;
              height: 40px;
            }
            .title {
              font-family: 'Cinzel', serif;
              font-size: 14px;
              color: #d4af37;
              font-weight: 600;
            }
            .subtitle {
              font-size: 10px;
              color: rgba(255,255,255,0.6);
            }
            .member-id {
              font-family: monospace;
              font-size: 18px;
              color: #d4af37;
              font-weight: 600;
              margin-bottom: 16px;
              letter-spacing: 2px;
            }
            .name {
              font-size: 20px;
              font-weight: 600;
              margin-bottom: 4px;
            }
            .phone {
              font-size: 14px;
              color: rgba(255,255,255,0.7);
              margin-bottom: 20px;
            }
            .barcode-container {
              background: white;
              padding: 12px;
              border-radius: 8px;
              display: flex;
              justify-content: center;
            }
            .barcode-container svg {
              width: 100%;
              height: 50px;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="card p-6 rounded-2xl border border-primary/30 divine-glow"
      >
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-primary/20 mb-4">
          <CrossIcon size="sm" glow />
          <div>
            <p className="font-serif text-sm font-semibold text-primary">Immanuel AG Church</p>
            <p className="text-xs text-muted-foreground">Member Identification Card</p>
          </div>
        </div>

        {/* Member ID */}
        <p className="font-mono text-xl text-primary font-semibold tracking-widest mb-4">
          {member.memberId}
        </p>

        {/* Name & Phone */}
        <p className="text-xl font-semibold text-foreground mb-1">{member.name}</p>
        <p className="text-sm text-muted-foreground mb-6">{member.phone}</p>

        {/* Barcode */}
        <div className="bg-white p-3 rounded-lg flex justify-center">
          <Barcode
            value={member.memberId}
            width={1.5}
            height={50}
            fontSize={12}
            margin={0}
            background="transparent"
          />
        </div>
      </div>

      {/* Print Button */}
      <Button onClick={handlePrint} className="w-full gap-2 bg-primary hover:bg-primary/90">
        <Printer className="w-4 h-4" />
        Print ID Card
      </Button>
    </div>
  );
};
