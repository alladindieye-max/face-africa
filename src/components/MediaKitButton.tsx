'use client';

export default function MediaKitButton() {
  return (
    <button className="button primary no-print" type="button" onClick={() => window.print()}>
      Télécharger le Media Kit (PDF)
    </button>
  );
}
