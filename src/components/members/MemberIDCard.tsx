import React, { useRef } from 'react';
import { Member } from '@/types';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import Barcode from 'react-barcode';

interface MemberIDCardProps {
  member: Member;
}

// CR80 standard: 85.6mm × 53.98mm (aspect ratio ≈ 1.586:1)
// We'll use 342px × 216px for screen display (maintaining ratio)

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
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Inter', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
              padding: 20px;
            }
            
            .card {
              width: 342px;
              height: 216px;
              background: linear-gradient(135deg, #1a2942 0%, #0f1829 100%);
              border-radius: 12px;
              color: white;
              box-shadow: 0 10px 40px rgba(0,0,0,0.3);
              display: flex;
              overflow: hidden;
              position: relative;
            }
            
            .left-section {
              width: 35%;
              background: linear-gradient(180deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 16px;
              border-right: 1px solid rgba(212, 175, 55, 0.2);
            }
            
            .cross-container {
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 12px;
            }
            
            .cross-svg {
              width: 48px;
              height: 64px;
              filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.5));
            }
            
            .church-name {
              font-family: 'Cinzel', serif;
              font-size: 10px;
              color: #d4af37;
              font-weight: 600;
              text-align: center;
              line-height: 1.3;
            }
            
            .right-section {
              width: 65%;
              padding: 16px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            
            .member-info {
              flex: 1;
            }
            
            .id-label {
              font-size: 8px;
              color: rgba(255,255,255,0.5);
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 2px;
            }
            
            .member-id {
              font-family: monospace;
              font-size: 14px;
              color: #d4af37;
              font-weight: 600;
              letter-spacing: 2px;
              margin-bottom: 12px;
            }
            
            .name {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 4px;
              word-wrap: break-word;
              line-height: 1.2;
            }
            
            .phone {
              font-size: 12px;
              color: rgba(255,255,255,0.7);
            }
            
            .barcode-container {
              background: white;
              padding: 8px;
              border-radius: 6px;
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-top: auto;
            }
            
            .barcode-container svg {
              width: 100%;
              max-width: 140px;
              height: 35px;
            }
            
            .barcode-text {
              font-size: 8px;
              color: #333;
              font-family: monospace;
              margin-top: 2px;
            }

            @media print {
              body {
                background: white;
                padding: 0;
              }
              .card {
                box-shadow: none;
                margin: 10mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="left-section">
              <div class="cross-container">
                <svg class="cross-svg" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#f0d060" />
                      <stop offset="50%" stop-color="#d4af37" />
                      <stop offset="100%" stop-color="#f0d060" />
                    </linearGradient>
                  </defs>
                  <rect x="9" y="0" width="6" height="32" rx="1" fill="url(#goldGrad)" />
                  <rect x="2" y="6" width="20" height="5" rx="1" fill="url(#goldGrad)" />
                </svg>
              </div>
              <div class="church-name">Immanuel AG<br/>Church</div>
            </div>
            <div class="right-section">
              <div class="member-info">
                <div class="id-label">Member ID</div>
                <div class="member-id">${member.memberId}</div>
                <div class="name">${member.name}</div>
                <div class="phone">${member.phone}</div>
              </div>
              <div class="barcode-container">
                ${cardRef.current?.querySelector('.barcode-wrapper')?.innerHTML || ''}
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <div className="space-y-4">
      {/* ID Card - CR80 Standard Ratio */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-xl border border-primary/30 divine-glow"
        style={{
          width: '342px',
          height: '216px',
          background: 'linear-gradient(135deg, hsl(220, 40%, 15%) 0%, hsl(220, 45%, 8%) 100%)',
        }}
      >
        <div className="flex h-full">
          {/* Left Section - Cross */}
          <div 
            className="flex flex-col items-center justify-center px-4 border-r border-primary/20"
            style={{
              width: '35%',
              background: 'linear-gradient(180deg, hsl(43, 74%, 49%, 0.15) 0%, hsl(43, 74%, 49%, 0.05) 100%)',
            }}
          >
            <div className="mb-3">
              <svg
                viewBox="0 0 24 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-16 drop-shadow-[0_0_10px_hsl(43,74%,49%,0.5)]"
              >
                <defs>
                  <linearGradient id="goldGradientCard" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(43, 80%, 60%)" />
                    <stop offset="50%" stopColor="hsl(43, 74%, 49%)" />
                    <stop offset="100%" stopColor="hsl(43, 80%, 55%)" />
                  </linearGradient>
                </defs>
                <rect x="9" y="0" width="6" height="32" rx="1" fill="url(#goldGradientCard)" />
                <rect x="2" y="6" width="20" height="5" rx="1" fill="url(#goldGradientCard)" />
              </svg>
            </div>
            <p className="font-serif text-[10px] font-semibold text-primary text-center leading-tight">
              Immanuel AG<br />Church
            </p>
          </div>

          {/* Right Section - Member Details */}
          <div className="flex flex-col justify-between p-4" style={{ width: '65%' }}>
            <div>
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">
                Member ID
              </p>
              <p className="font-mono text-sm text-primary font-semibold tracking-widest mb-3">
                {member.memberId}
              </p>
              <p className="text-base font-semibold text-foreground leading-tight mb-1 break-words">
                {member.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {member.phone}
              </p>
            </div>

            {/* Barcode */}
            <div className="barcode-wrapper bg-white p-2 rounded-md flex flex-col items-center mt-auto">
              <Barcode
                value={member.memberId}
                width={1.2}
                height={35}
                fontSize={0}
                margin={0}
                background="transparent"
                displayValue={false}
              />
              <span className="text-[8px] text-gray-700 font-mono mt-0.5">
                {member.memberId}
              </span>
            </div>
          </div>
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
