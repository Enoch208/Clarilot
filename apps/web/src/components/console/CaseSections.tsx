import type { ReactNode } from "react";
import type { Alert } from "@clarilot/core";
import { shortageBadges } from "@/lib/evidence";
import { formatSourceDate } from "@/lib/format";
import { Badge } from "./Badge";
import { Field } from "./Panel";

export function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line px-5 py-4">
      <h3 className="mb-3 type-tag text-mute uppercase tracking-[0.06em]">{title}</h3>
      {children}
    </section>
  );
}

export function MatchBlock({ alert }: { alert: Alert }) {
  return (
    <Block title="What matched">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-3">
        <Field label="Dispensed NDC (raw)" mono>
          {alert.dispense.productNdcRaw}
        </Field>
        <Field label="Recall NDC (raw)" mono>
          {alert.recall.productNdcRaw}
        </Field>
        <Field label="Canonical product key" mono>
          {alert.recall.productNdcKey}
        </Field>
        <Field label="Dispensed lot" mono>
          {alert.dispense.lotNo ?? "missing"}
        </Field>
        <Field label="Lots read from notice" mono>
          {alert.lot.parsedLotTokens.length === 0 ? "none" : alert.lot.parsedLotTokens.join(", ")}
        </Field>
        <Field label="Matched lot token" mono>
          {alert.lot.matchedToken ?? "none"}
        </Field>
      </dl>
      <p className="mt-3 font-mono text-[0.72rem] text-mute">
        classifier {alert.lot.classifierVersion}
      </p>
    </Block>
  );
}

export function DispenseBlock({ alert }: { alert: Alert }) {
  return (
    <Block title="Dispensing record (synthetic)">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-3">
        <Field label="Patient">
          {alert.patient.displayName}{" "}
          <span className="font-mono text-[0.75rem] text-mute">#{alert.patient.patientId}</span>
        </Field>
        <Field label="Drug label">{alert.dispense.drugLabel}</Field>
        <Field label="Store">
          {alert.store.name}, {alert.store.city}
        </Field>
        <Field label="Dispensed at" mono>
          {alert.dispense.dispensedAt.replace("T", " ").slice(0, 16)} UTC
        </Field>
        <Field label="Quantity" mono>
          {alert.dispense.qty}
        </Field>
        <Field label="Prescription" mono>
          rx #{alert.dispense.rxId}
        </Field>
      </dl>
    </Block>
  );
}

export function ReceivingBlock({ alert }: { alert: Alert }) {
  const matched = alert.receiving.status === "RECEIPT_MATCHED";
  return (
    <Block title="Receiving ledger provenance">
      <p className={`mb-3 text-[0.875rem] ${matched ? "text-ink" : "text-caution"}`}>
        {matched ? "Receipt found for this product, lot and store." : "No matching receipt."}{" "}
        {alert.receiving.note}
      </p>
      {matched ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-4">
          <Field label="Receipt" mono>
            {alert.receiving.receiptId ?? "unknown"}
          </Field>
          <Field label="Supplier">{alert.receiving.supplier ?? "unknown"}</Field>
          <Field label="Received" mono>
            {alert.receiving.receivedAt ?? "unknown"}
          </Field>
          <Field label="Lot" mono>
            {alert.receiving.lotNo ?? "unknown"}
          </Field>
        </dl>
      ) : null}
    </Block>
  );
}

export function ShortageBlock({ alert }: { alert: Alert }) {
  const shortage = alert.shortage;
  return (
    <Block title="Shortage context (information only)">
      <div className="flex flex-wrap items-center gap-2">
        <Badge spec={shortageBadges[shortage.evidence]} />
        {shortage.sourceStatus === null ? null : (
          <span className="text-[0.8125rem] text-ink">FDA status: {shortage.sourceStatus}</span>
        )}
        {shortage.updateDate === null ? null : (
          <span className="text-[0.8125rem] text-mute">
            updated {formatSourceDate(shortage.updateDate)}
          </span>
        )}
      </div>
      {shortage.availability === null ? null : (
        <p className="mt-2 text-[0.875rem] text-ink">{shortage.availability}</p>
      )}
      <p className="mt-2 text-[0.8125rem] text-mute">
        {shortage.note} Scope: {shortage.scope}. Not a substitution recommendation; consult the
        prescriber or pharmacist.
      </p>
    </Block>
  );
}
