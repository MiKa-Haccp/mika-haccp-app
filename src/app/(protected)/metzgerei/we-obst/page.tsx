"use client";

import { WareneingangForm } from "../_components/WareneingangForm";

export default function MetzgereiWeObstPage() {
  return (
    <WareneingangForm
      definitionId="FORM_METZ_WE_OBST"
      title="Metzgerei · Wareneingang Obst/Gemüse"
      description="Wareneingang für nicht kühlpflichtige Ware."
      wareType="ambient"
    />
  );
}
