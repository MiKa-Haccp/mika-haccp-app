"use client";

import { WareneingangForm } from "../_components/WareneingangForm";

export default function MetzgereiWeFleischPage() {
  return (
    <WareneingangForm
      definitionId="FORM_METZ_WE_FLEISCH"
      title="Metzgerei · Wareneingang Fleisch"
      description="Dokumentation der gekühlten Fleisch-Lieferungen."
      wareType="chilled"
    />
  );
}
