"use client";

import { useMemo, useState } from "react";
import { Clapperboard } from "lucide-react";

import EmptyStateCard from "@/components/panel/EmptyStateCard";
import CreateMenu from "@/components/panel/tools/CreateMenu";
import DataTable from "@/components/panel/tools/DataTable";
import ModalForm from "@/components/panel/tools/ModalForm";
import ToolsSearchBar from "@/components/panel/tools/ToolsSearchBar";
import ToolsTabBar from "@/components/panel/tools/ToolsTabBar";
import { CREATE_OPTIONS, TOOLS_TABS } from "@/components/panel/tools/toolsConfig";

function cellText(value) {
  if (value == null) return "";
  if (typeof value === "object") return String(value.label ?? "");
  return String(value);
}

export default function ToolsPage() {
  const [tabId, setTabId] = useState(TOOLS_TABS[0].id);
  const [search, setSearch] = useState("");
  const [filterField, setFilterField] = useState("all");
  const [modalOption, setModalOption] = useState(null);

  const tab = TOOLS_TABS.find((entry) => entry.id === tabId) ?? TOOLS_TABS[0];

  const filteredRows = useMemo(() => {
    if (tab.empty || tab.linkTo || !tab.rows) return [];
    const query = search.trim().toLowerCase();
    if (!query) return tab.rows;
    return tab.rows.filter((row) => {
      const keys = filterField === "all" ? tab.columns.map((column) => column.key) : [filterField];
      return keys.some((key) => cellText(row[key]).toLowerCase().includes(query));
    });
  }, [tab, search, filterField]);

  const changeTab = (nextId) => {
    setTabId(nextId);
    setSearch("");
    setFilterField("all");
  };

  return (
    <div className="flex min-h-full flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ToolsTabBar tabs={TOOLS_TABS} active={tabId} onChange={changeTab} />
        <CreateMenu options={CREATE_OPTIONS} onSelect={setModalOption} />
      </div>

      {tab.linkTo ? (
        <a
          href={tab.linkTo}
          className="flex flex-col gap-2 rounded-3xl p-8 no-underline"
          style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
        >
          <span className="text-lg font-bold" style={{ color: "var(--vp-text)" }}>
            {tab.linkTitle}
          </span>
          <span className="text-sm" style={{ color: "var(--vp-muted)" }}>
            {tab.linkDescription}
          </span>
          <span className="mt-3 text-sm font-semibold" style={{ color: "var(--vp-accent)" }}>
            Ver paquetes →
          </span>
        </a>
      ) : null}

      {!tab.empty && !tab.linkTo ? (
        <ToolsSearchBar
          search={search}
          onSearchChange={setSearch}
          filterField={filterField}
          onFilterChange={setFilterField}
          fields={tab.columns}
        />
      ) : null}

      {tab.empty ? (
        <EmptyStateCard
          icon={Clapperboard}
          title="No media available"
          description="There isn't any record of media resources"
        />
      ) : !tab.linkTo ? (
        <DataTable
          title={tab.title}
          columns={tab.columns}
          rows={filteredRows}
          minWidth={tab.minWidth}
        />
      ) : null}

      <ModalForm option={modalOption} onClose={() => setModalOption(null)} />
    </div>
  );
}
