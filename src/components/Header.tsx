import { motion } from "framer-motion";

export function Header() {
    return (
        <header className="w-full py-6 px-4 md:px-8 flex justify-between items-center border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
            >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">AGI Bubble</h1>
            </motion.div>


        </header>
    );
}
