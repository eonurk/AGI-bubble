import { Button } from "@/components/ui/button";
import { Share2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function CallToAction() {
    const handleFormClick = () => window.open("https://forms.gle/Y2L2mpNV78Xtax9h6", "_blank");
    
    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        } catch (e) { console.error(e); }
    };

    return (
        <section className="py-20 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="container max-w-4xl mx-auto px-4 relative z-10 text-center space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-4"
                >
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                        Don't just watch the timeline.
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                            Shape the consensus.
                        </span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Your prediction adds signal to the noise. Join hundreds of others in defining the future of AGI.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                    <Button 
                        size="lg" 
                        onClick={handleFormClick}
                        className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all bg-gradient-to-r from-primary to-purple-600 border-0"
                    >
                        <Sparkles className="mr-2 w-5 h-5" /> Add Your Prediction
                    </Button>
                    <Button 
                        variant="outline" 
                        size="lg" 
                        onClick={handleShare}
                        className="h-14 px-8 text-lg rounded-full border-2 hover:bg-secondary/50"
                    >
                        <Share2 className="mr-2 w-5 h-5" /> Invite Friends
                    </Button>
                </motion.div>

                <p className="text-sm text-muted-foreground/60 pt-4">
                    Takes less than 30 seconds • No email required
                </p>
            </div>
        </section>
    );
}
