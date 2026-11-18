export function BeginnerGuide() {
  return (
    <div className="space-y-12">
      {/* Section 1: Essential Formula Sheet */}
      <section id="formulas" aria-labelledby="formulas-heading" className="space-y-6">
        <div className="space-y-1.5">
          <h2
            id="formulas-heading"
            className="font-display text-2xl font-semibold text-slate-900 tracking-tight"
          >
            Core Tactical Formulas
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            Every calculator above runs on standard land navigation and field estimation
            equations. Keep these four reference rules handy in the field.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5">
            <div className="text-xs font-medium text-amber-700">
              01. Magnetic Declination
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              East Is Least, West Is Best
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              When converting from a paper map (Grid) to a compass (Magnetic), subtract
              East declination and add West declination. Reverse the sign when plotting
              a compass reading back onto a map.
            </p>
            <div className="pt-2 text-xs font-mono tabular-nums text-slate-700 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2">
              Mag = Grid − EastDecl · Mag = Grid + WestDecl
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5">
            <div className="text-xs font-medium text-amber-700">
              02. Dead Reckoning & Climb Time
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              Pace Count & Naismith’s Rule
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Count double-paces (every left-foot strike) rather than single steps to cut
              counting errors in half. Add 10 minutes for every 100 meters of total climb
              to estimate arrival time.
            </p>
            <div className="pt-2 text-xs font-mono tabular-nums text-slate-700 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2">
              Time (min) = (km ÷ speed × 60) + (climb_m ÷ 10)
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5">
            <div className="text-xs font-medium text-amber-700">
              03. Optical Range Estimation
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              The WORM Mil-Relation Formula
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              One NATO mil subtends 1 meter at 1,000 meters distance. If you know an
              object’s real width or height in meters and measure its span in mils,
              divide to find range.
            </p>
            <div className="pt-2 text-xs font-mono tabular-nums text-slate-700 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2">
              Distance (m) = (Known Size_m × 1000) ÷ Apparent Mils
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5">
            <div className="text-xs font-medium text-amber-700">
              04. Map Grid Coordinates
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              Read Right, Then Up
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Always read the horizontal Easting value first (left to right) and the
              vertical Northing value second (bottom to top). Six digits narrow position
              to 100 meters; eight digits narrow to 10 meters.
            </p>
            <div className="pt-2 text-xs font-mono tabular-nums text-slate-700 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2">
              Distance = √(ΔE² + ΔN²) · Bearing = atan2(ΔE, ΔN)
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Beginner Pitfalls Checklist */}
      <section
        id="beginner-guide"
        aria-labelledby="beginner-guide-heading"
        className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
      >
        <div className="space-y-1.5 border-b border-slate-100 pb-4">
          <h2
            id="beginner-guide-heading"
            className="font-display text-2xl font-semibold text-slate-900 tracking-tight"
          >
            Beginner Field Checklist
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            Four quick habits that prevent the most common navigation and calculation
            mistakes when starting out.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1.5">
            <div className="text-sm font-semibold text-slate-900">
              Check Degrees vs. Mils
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              A full circle is 360° or 6,400 NATO mils (1° ≈ 17.8 mils). Never enter
              degrees into a mil-relation range calculation.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="text-sm font-semibold text-slate-900">
              Calibrate With Your Load
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              A heavy backpack shortens your stride. Measure your 100 m pace count while
              wearing your actual field gear.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="text-sm font-semibold text-slate-900">
              Verify Back Azimuths
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Before stepping off, note your return bearing (±180°) so you can confirm
              landmarks behind you or reverse course immediately.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="text-sm font-semibold text-slate-900">
              Break Routes Into Short Legs
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Small compass drift adds up over long distances. Plan 300 m to 800 m legs
              into unmistakable terrain features like road junctions or ridges.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
