/**
 * The opening dua the students say together before they start (owner's
 * request, 2026-10-08). Quran text with its reference, and the hadith with its
 * source, exactly as they are usually written.
 */
export function Dua({ className = '' }: { className?: string }) {
  return (
    <figure className={`rounded border border-gold/40 bg-gold/[0.06] p-5 text-center ${className}`}>
      <figcaption className="text-sm font-extrabold text-gold">قبل ما تبدأ، قول معانا 🤲</figcaption>
      <blockquote className="mt-3 space-y-3 text-lg font-bold leading-loose text-ink">
        <p>
          ﴿رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي ۝ وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي ۝ يَفْقَهُوا قَوْلِي﴾
          <span className="block text-xs font-bold text-ink-muted">[طه: ٢٥–٢٨]</span>
        </p>
        <p>
          «اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا»
          <span className="block text-xs font-bold text-ink-muted">رواه ابن حبان</span>
        </p>
      </blockquote>
    </figure>
  )
}
