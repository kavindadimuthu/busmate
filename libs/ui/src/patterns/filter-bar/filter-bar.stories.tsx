import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { FilterBar, FilterSelect } from "@busmate/ui/patterns/filter-bar";

const meta: Meta<typeof FilterBar> = {
  title: "Patterns/FilterBar",
  component: FilterBar,
};

export default meta;
type Story = StoryObj<typeof FilterBar>;

export const Default: Story = {
  render: function FilterBarStory() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("__all__");
    const [region, setRegion] = useState("__all__");

    const activeCount = [status, region].filter((v) => v !== "__all__").length;

    return (
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search routes..."
        activeFilterCount={activeCount}
        onClearAll={() => {
          setStatus("__all__");
          setRegion("__all__");
        }}
      >
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
            { value: "pending", label: "Pending" },
            { value: "draft", label: "Draft" },
          ]}
        />
        <FilterSelect
          label="Region"
          value={region}
          onChange={setRegion}
          options={[
            { value: "western", label: "Western Province" },
            { value: "central", label: "Central Province" },
            { value: "southern", label: "Southern Province" },
            { value: "northern", label: "Northern Province" },
          ]}
        />
      </FilterBar>
    );
  },
};

export const SearchOnly: Story = {
  render: function SearchOnlyStory() {
    const [search, setSearch] = useState("");
    return (
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search bus stops..."
      />
    );
  },
};
