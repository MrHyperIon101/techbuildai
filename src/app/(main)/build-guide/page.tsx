
"use client";

import React, { useState } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/common/glass-card';
import { SectionTitle } from '@/components/common/section-title';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle, Wrench, Cpu, MemoryStick, CircuitBoard, Video, HardDrive, PlugZap, Cable, Network, Power, PackageSearch } from 'lucide-react';
import type { BuildGuideStep } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const guideSteps: BuildGuideStep[] = [
  {
    id: 1,
    title: "Preparation & Unboxing",
    description: "Gather your tools and components. Ensure you have an anti-static wrist strap and a clear, well-lit workspace.",
    icon: PackageSearch,
    details: [
      "Required tools: Phillips head screwdriver (magnetic tip recommended), anti-static wrist strap, zip ties or Velcro straps for cable management.",
      "Optional tools: Flashlight, wire cutters/strippers (for custom cables, rarely needed).",
      "Carefully unbox all components and check for any physical damage.",
      "Organize screws and small parts in labeled containers.",
    ],
  },
  {
    id: 2,
    title: "CPU Installation",
    description: "Install the CPU onto the motherboard. This is a delicate step, so handle with care.",
    icon: Cpu,
    details: [
      "Open the CPU socket lever on the motherboard.",
      "Align the CPU's arrow/triangle with the corresponding mark on the socket.",
      "Gently place the CPU into the socket. Do not force it.",
      "Close the socket lever. It may require a bit of pressure.",
    ],
  },
  {
    id: 3,
    title: "RAM Installation",
    description: "Install RAM modules into the motherboard slots.",
    icon: MemoryStick,
    details: [
      "Open the clips on the RAM slots you intend to use (refer to motherboard manual for dual-channel configuration).",
      "Align the notch on the RAM module with the notch in the RAM slot.",
      "Apply even pressure on both ends of the RAM module until it clicks into place and the clips close.",
    ],
  },
  {
    id: 4,
    title: "Motherboard Installation",
    description: "Mount the motherboard into the PC case.",
    icon: CircuitBoard,
    details: [
      "Install standoffs in the PC case if they are not pre-installed.",
      "Place the I/O shield (if separate) into the case opening.",
      "Carefully lower the motherboard onto the standoffs, aligning with the I/O shield and screw holes.",
      "Secure the motherboard with screws.",
    ],
  },
  {
    id: 5,
    title: "GPU Installation",
    description: "Install the graphics card into the appropriate PCI-e slot.",
    icon: Video,
    details: [
      "Remove the PCI slot covers on the case corresponding to the PCI-e x16 slot you'll use (usually the top-most one).",
      "Open the retaining clip on the PCI-e slot.",
      "Align the GPU's connector with the slot and press down firmly until it clicks in.",
      "Secure the GPU with screws to the case.",
    ],
  },
  {
    id: 6,
    title: "Storage Installation (SSD/HDD)",
    description: "Install SSDs and/or HDDs into their respective drive bays.",
    icon: HardDrive,
    details: [
      "Mount M.2 SSDs directly onto the motherboard M.2 slots and secure with the screw/clip.",
      "Mount 2.5-inch SSDs or 3.5-inch HDDs into drive bays/cages.",
      "Secure them with screws.",
    ],
  },
  {
    id: 7,
    title: "Power Supply (PSU) Installation",
    description: "Place the PSU into its bay and connect main power cables.",
    icon: PlugZap,
    details: [
      "Place the PSU in its designated bay (usually bottom or top rear of the case).",
      "Secure with screws from the outside of the case.",
      "If modular, connect only the necessary cables to the PSU before installation or as you go.",
    ],
  },
  {
    id: 8,
    title: "Connecting Cables",
    description: "Connect all necessary power and data cables. This is often the most complex part.",
    icon: Cable,
    details: [
      "Connect the 24-pin ATX power connector to the motherboard.",
      "Connect the CPU power connector (4+4 pin or 8-pin) to the motherboard.",
      "Connect PCIe power connectors to the GPU (if required).",
      "Connect SATA power and data cables to SSDs/HDDs.",
      "Connect front panel connectors (power switch, reset switch, LEDs, USB, audio) to the motherboard headers (refer to manual).",
      "Connect case fan power cables.",
    ],
  },
  {
    id: 9,
    title: "Cable Management",
    description: "Organize cables for better airflow and aesthetics.",
    icon: Network, // Representing organized connections
    details: [
      "Route cables behind the motherboard tray where possible.",
      "Use zip ties or Velcro straps to bundle cables together.",
      "Ensure cables do not obstruct fans.",
      "Good cable management improves airflow and makes future upgrades easier.",
    ],
  },
  {
    id: 10,
    title: "First Boot & OS Installation",
    description: "Perform the initial boot-up, check BIOS/UEFI, and install your operating system.",
    icon: Power,
    details: [
      "Connect monitor, keyboard, mouse, and power cable.",
      "Turn on the PC. Enter BIOS/UEFI (usually by pressing DEL or F2 key on startup).",
      "Verify that CPU, RAM, and storage drives are detected.",
      "Set boot priority to your OS installation media (USB drive or DVD).",
      "Install the operating system.",
      "Install drivers for all components.",
    ],
  },
];


export default function PcBuildGuidePage() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = guideSteps[currentStepIndex];
  const CurrentIcon = currentStep.icon;

  const goToNextStep = () => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, guideSteps.length - 1));
  };

  const goToPreviousStep = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="space-y-8">
      <SectionTitle>PC Build Guide</SectionTitle>
      <GlassCard className="overflow-hidden">
        <GlassCardHeader className="bg-primary/10 p-4 md:p-6">
          <GlassCardTitle className="text-2xl md:text-3xl text-primary">
            Step {currentStep.id}: {currentStep.title}
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg group bg-muted/20 flex items-center justify-center">
            {CurrentIcon && (
              <CurrentIcon size={128} className="text-primary opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </div>
          
          <ScrollArea className="h-[300px] lg:h-[400px] pr-3">
            <div className="space-y-4">
              <p className="text-foreground/90 text-base leading-relaxed">{currentStep.description}</p>
              {currentStep.details && currentStep.details.length > 0 && (
                <ul className="space-y-2 mt-4 pl-5">
                  {currentStep.details.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-accent mr-2 mt-1 shrink-0" />
                      <span className="text-sm text-muted-foreground">{detail}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ScrollArea>
        </GlassCardContent>
        <div className="p-4 md:p-6 border-t border-white/10 flex justify-between items-center">
          <Button
            onClick={goToPreviousStep}
            disabled={currentStepIndex === 0}
            variant="outline"
            className="rounded-full border-primary text-primary hover:bg-primary/10"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Step {currentStepIndex + 1} of {guideSteps.length}
          </span>
          <Button
            onClick={goToNextStep}
            disabled={currentStepIndex === guideSteps.length - 1}
            variant="default"
            className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
