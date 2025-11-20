export function Footer() {
    return (
        <footer className="w-full py-8 px-4 border-t border-border/40 mt-auto bg-muted/20">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                <div>
                    © {new Date().getFullYear()} AGI Bubble. All rights reserved.
                </div>
                <div className="flex items-center gap-6">
                    <a href="https://eonurk.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                        Created by @eonurk
                    </a>
                    <a href="https://github.com/eonurk/AGIbubble" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                        GitHub
                    </a>
                </div>
            </div>
        </footer>
    );
}
