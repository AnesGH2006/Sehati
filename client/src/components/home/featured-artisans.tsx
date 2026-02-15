import { ArtisanCard } from "@/components/artisan/artisan-card";
import { MOCK_ARTISANS } from "@/lib/constants";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export function FeaturedArtisans() {
  const { t } = useTranslation();
  
  // Get top rated artisans
  const featured = MOCK_ARTISANS.sort((a, b) => b.rating - a.rating).slice(0, 3);

  return (
    <section className="py-24 bg-muted/20 relative overflow-hidden">
      <div className="container px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="space-y-4 text-right">
            <h2 className="text-3xl md:text-5xl font-heading font-bold">الحرفيين المتميزين</h2>
            <p className="text-lg text-muted-foreground">نخبة من أمهر الحرفيين الموثوقين في الجزائر بناءً على تقييمات الزبائن.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featured.map((artisan, idx) => (
            <motion.div
              key={artisan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <ArtisanCard {...artisan} yearsOfExperience={idx + 5} isVerified={true} portfolioImages={["1", "2"]} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
