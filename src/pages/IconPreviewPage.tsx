import { useMemo, useState } from "react";
import Icon, { ICON_NAMES } from "../components/Icon";

const IconPreviewPage = () => {
  const [query, setQuery] = useState("");

  const filteredIconNames = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return ICON_NAMES;
    }

    return ICON_NAMES.filter((name) =>
      name.toLowerCase().includes(normalizedQuery)
    );
  }, [query]);

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-6 text-gray-900">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5">
        <header className="flex flex-col gap-3 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-[24px] font-semibold leading-8">
              Common Icon Preview
            </h1>
            <p className="mt-1 text-[14px] leading-5 text-gray-650">
              src/components/Icon.tsx 기준 현재 공통 아이콘 name 매칭 확인용
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex w-full max-w-[360px] flex-col gap-1 text-[13px] font-medium text-gray-750">
              Search name
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="예: home, active, alarm"
                className="h-10 rounded-[8px] border border-gray-200 bg-white px-3 text-[14px] font-normal text-gray-900 outline-none focus:border-primary"
              />
            </label>
            <span className="text-[13px] text-gray-650">
              {filteredIconNames.length} / {ICON_NAMES.length}
            </span>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredIconNames.map((name) => (
            <article
              key={name}
              className="flex min-h-[116px] flex-col items-center justify-center gap-3 rounded-[8px] border border-gray-200 bg-white p-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-[8px] border border-gray-150 bg-gray-50">
                <Icon name={name} className="h-7 w-7" />
              </div>
              <code className="w-full break-words text-center text-[12px] leading-4 text-gray-800">
                {name}
              </code>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
};

export default IconPreviewPage;
