
"use client";

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/common/glass-card';
import { SectionTitle } from '@/components/common/section-title';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { handleGetComponentDetails } from '@/lib/actions';
import type { ComponentDetails, RelatedProduct, ShoppingLink } from '@/lib/types';
import { useConversation } from '@/contexts/conversation-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Cpu, ShoppingCart, ExternalLink, ListChecks, Zap, Info, Laptop, MonitorPlay, ChevronsDown, ChevronsUp } from 'lucide-react';
// import Link from 'next/link'; // Not used currently
// import Image from 'next/image'; // Image display temporarily removed

const componentSearchSchema = z.object({
  componentName: z.string().min(2, "Component name must be at least 2 characters.").max(100, "Component name is too long."),
});

type ComponentSearchValues = z.infer<typeof componentSearchSchema>;

const INITIAL_ITEMS_TO_SHOW = 2;

export default function ComponentDetailsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [details, setDetails] = useState<ComponentDetails | null>(null);
  const [searchedComponentName, setSearchedComponentName] = useState<string>("");
  const { toast } = useToast();
  const { addMessage } = useConversation();

  const [showAllLaptops, setShowAllLaptops] = useState(false);
  const [showAllPreBuiltPCs, setShowAllPreBuiltPCs] = useState(false);

  const form = useForm<ComponentSearchValues>({
    resolver: zodResolver(componentSearchSchema),
    defaultValues: {
      componentName: '',
    },
  });

  const onSubmit: SubmitHandler<ComponentSearchValues> = async (data) => {
    setIsLoading(true);
    setDetails(null);
    setSearchedComponentName(data.componentName);
    addMessage({ type: 'user', feature: 'components-db', content: `Search for component: ${data.componentName}` });
    setShowAllLaptops(false); // Reset on new search
    setShowAllPreBuiltPCs(false); // Reset on new search
    try {
      const result = await handleGetComponentDetails(data);
      setDetails(result);
      addMessage({ type: 'ai', feature: 'components-db', content: `Details for ${data.componentName}:`, data: result });
      toast({
        title: "Component Details Fetched!",
        description: `Successfully retrieved information for ${result.componentNameFromAI || data.componentName}.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Error Fetching Details",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'components-db', content: `Error: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  const relatedLaptops = details?.relatedProducts?.filter(p => p.type === 'Laptop') || [];
  const relatedPreBuiltPCs = details?.relatedProducts?.filter(p => p.type === 'Pre-built PC') || [];

  const displayedLaptops = showAllLaptops ? relatedLaptops : relatedLaptops.slice(0, INITIAL_ITEMS_TO_SHOW);
  const displayedPreBuiltPCs = showAllPreBuiltPCs ? relatedPreBuiltPCs : relatedPreBuiltPCs.slice(0, INITIAL_ITEMS_TO_SHOW);

  return (
    <div className="space-y-8">
      <SectionTitle>Component Database</SectionTitle>
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Search Component</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 md:flex md:items-end md:space-y-0 md:space-x-4">
              <FormField
                control={form.control}
                name="componentName"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Component Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., RTX 4080, Ryzen 7 7800X3D" {...field} className="bg-background/50 rounded-full px-4" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 transform hover:scale-105 shrink-0">
                {isLoading ? <LoadingSpinner /> : 'Get Details'}
              </Button>
            </form>
          </Form>
        </GlassCardContent>
      </GlassCard>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner size={64} />
          <p className="mt-6 text-muted-foreground text-lg">Fetching component details for {searchedComponentName}...</p>
        </div>
      )}

      {!isLoading && !details && (
         <GlassCard className="mt-6">
           <GlassCardContent className="py-10 text-center">
            <Cpu size={56} className="text-primary mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">Enter a component name to discover its details.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Our AI will fetch comprehensive information for you.</p>
          </GlassCardContent>
         </GlassCard>
      )}

      {details && (
        <div className="mt-6 space-y-6 animate-fade-in">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="text-3xl">{details.componentNameFromAI || searchedComponentName}</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-accent mb-2 flex items-center">
                    <Zap size={20} className="mr-2"/> Overall Summary
                  </h3>
                  {details.overallSummary && details.overallSummary.trim() !== '' ? (
                     <p className="text-foreground/90 prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: details.overallSummary.replace(/\n/g, '<br />') }} />
                  ) : (
                    <p className="text-muted-foreground italic">Overall summary not available.</p>
                  )}
                </div>

                {details.keyFeatures && details.keyFeatures.length > 0 ? (
                  <div>
                    <h3 className="text-xl font-semibold text-accent mb-2 flex items-center">
                       <ListChecks size={20} className="mr-2"/> Key Features
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-foreground/90 pl-1">
                      {details.keyFeatures.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-semibold text-accent mb-2 flex items-center">
                       <ListChecks size={20} className="mr-2"/> Key Features
                    </h3>
                    <p className="text-muted-foreground italic">Key features not available.</p>
                  </div>
                )}
              </div>
            </GlassCardContent>
          </GlassCard>

          {details.technicalCategories && details.technicalCategories.length > 0 ? (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Technical Specifications</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {details.technicalCategories.map((category, catIndex) => (
                  <div key={catIndex} className="break-inside-avoid">
                    <h4 className="text-lg font-semibold text-primary mb-2 border-b border-primary/20 pb-1">{category.category}</h4>
                    {category.specs && category.specs.length > 0 ? (
                      <ul className="space-y-1 text-sm">
                        {category.specs.map((spec, specIndex) => (
                          <li key={specIndex} className="flex justify-between">
                            <span className="text-muted-foreground">{spec.spec}:</span>
                            <span className="text-foreground/90 text-right">{spec.value}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                       <p className="text-sm text-muted-foreground italic">No specifications listed for this category.</p>
                    )}
                  </div>
                ))}
              </GlassCardContent>
            </GlassCard>
          ) : (
             <GlassCard>
                <GlassCardHeader>
                    <GlassCardTitle>Technical Specifications</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                    <div className="flex items-center text-muted-foreground">
                        <Info size={20} className="mr-2" />
                        <p>Detailed technical specifications are not available for this component.</p>
                    </div>
                </GlassCardContent>
            </GlassCard>
          )}
          
          {details.shoppingLinks && details.shoppingLinks.length > 0 && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Shopping Links (Component)</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-3">
                {details.shoppingLinks.map((link, index) => (
                  <ShoppingLinkDisplay key={`component-shop-${index}`} link={link} />
                ))}
              </GlassCardContent>
            </GlassCard>
          )}
          
          {(relatedLaptops.length > 0 || relatedPreBuiltPCs.length > 0) ? (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Related Products</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-8">
                {relatedLaptops.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-semibold text-primary mb-4 flex items-center">
                      <Laptop size={28} className="mr-3" /> Laptops Featuring {details.componentNameFromAI || searchedComponentName}
                    </h3>
                    <div className="space-y-6">
                      {displayedLaptops.map((product, index) => (
                        <RelatedProductCard key={`laptop-${index}`} product={product} />
                      ))}
                    </div>
                    {relatedLaptops.length > INITIAL_ITEMS_TO_SHOW && (
                      <Button
                        variant="outline"
                        onClick={() => setShowAllLaptops(!showAllLaptops)}
                        className="mt-6 w-full rounded-full border-accent text-accent hover:bg-accent/10"
                      >
                        {showAllLaptops ? <ChevronsUp className="mr-2" /> : <ChevronsDown className="mr-2" />}
                        {showAllLaptops ? `Show Fewer Laptops` : `Show All ${relatedLaptops.length} Laptops`}
                      </Button>
                    )}
                  </div>
                )}

                {relatedPreBuiltPCs.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-semibold text-primary mb-4 flex items-center">
                      <MonitorPlay size={28} className="mr-3" /> Pre-built PCs Featuring {details.componentNameFromAI || searchedComponentName}
                    </h3>
                    <div className="space-y-6">
                      {displayedPreBuiltPCs.map((product, index) => (
                        <RelatedProductCard key={`pc-${index}`} product={product} />
                      ))}
                    </div>
                    {relatedPreBuiltPCs.length > INITIAL_ITEMS_TO_SHOW && (
                      <Button
                        variant="outline"
                        onClick={() => setShowAllPreBuiltPCs(!showAllPreBuiltPCs)}
                        className="mt-6 w-full rounded-full border-accent text-accent hover:bg-accent/10"
                      >
                        {showAllPreBuiltPCs ? <ChevronsUp className="mr-2" /> : <ChevronsDown className="mr-2" />}
                        {showAllPreBuiltPCs ? `Show Fewer Pre-built PCs` : `Show All ${relatedPreBuiltPCs.length} Pre-built PCs`}
                      </Button>
                    )}
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          ) : (
             (!details.shoppingLinks || details.shoppingLinks.length === 0) && (
                <GlassCard>
                    <GlassCardHeader>
                        <GlassCardTitle>Shopping & Related Products</GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                        <div className="flex items-center text-muted-foreground">
                            <Info size={20} className="mr-2" />
                            <p>No shopping links or related products are available for this component at the moment.</p>
                        </div>
                    </GlassCardContent>
                </GlassCard>
             )
           )}
        </div>
      )}
    </div>
  );
}

function ShoppingLinkDisplay({ link }: { link: ShoppingLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-accent/10 transition-colors group"
    >
      <div className="flex items-center">
        <ShoppingCart size={20} className="mr-3 text-accent group-hover:text-accent-foreground" />
        <div>
          <span className="font-medium text-primary group-hover:text-accent-foreground">{link.store}</span>
          {link.price && <span className="ml-2 text-sm text-muted-foreground group-hover:text-accent-foreground/80"> - {link.price}</span>}
        </div>
      </div>
      <ExternalLink size={18} className="text-muted-foreground group-hover:text-accent-foreground" />
    </a>
  );
}

function RelatedProductCard({ product }: { product: RelatedProduct }) {
  const ProductIcon = product.type === 'Laptop' ? Laptop : MonitorPlay;
  return (
    <div className="p-4 rounded-lg border border-white/10 bg-card/50 hover:bg-card/80 transition-colors duration-200 shadow-md">
      <div className="flex items-center mb-2">
        <ProductIcon size={24} className="mr-3 text-primary" />
        <h4 className="text-lg font-semibold text-primary">{product.name} <span className="text-xs text-muted-foreground">({product.type})</span></h4>
      </div>
      
      {product.price && (
        <p className="text-xl font-bold text-accent mb-2">{product.price}</p>
      )}

      {product.keySpecs && product.keySpecs.length > 0 && (
        <div className="mb-3">
          <h5 className="text-sm font-medium text-muted-foreground mb-1">Key Specs:</h5>
          <ScrollArea className="max-h-[80px] pr-2">
            <ul className="list-disc list-inside space-y-0.5 text-xs text-foreground/80 pl-1">
              {product.keySpecs.map((spec, idx) => (
                <li key={idx}>{spec}</li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}

      {product.shoppingLinks && product.shoppingLinks.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-muted-foreground mb-1">Shop:</h5>
          <div className="space-y-2">
            {product.shoppingLinks.map((link, idx) => (
              <ShoppingLinkDisplay key={`prod-shop-${idx}`} link={link} />
            ))}
          </div>
        </div>
      )}
      {(!product.shoppingLinks || product.shoppingLinks.length === 0) && (
         <p className="text-xs text-muted-foreground italic">No direct shopping links available for this product at the moment.</p>
      )}
    </div>
  );
}

