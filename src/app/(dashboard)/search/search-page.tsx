'use client'

import { useSearch } from '@/hooks/use-search'
import { SearchBar } from '@/components/search/search-bar'
import { SearchFilters } from '@/components/search/search-filters'
import { SearchResults } from '@/components/search/search-results'

export function SearchPage() {
  const {
    query,
    setQuery,
    clearSearch,
    filters,
    setFilters,
    setPage,
    results,
    total,
    hasNextPage,
    page,
    isSearching,
    isActive,
    recentSearches,
  } = useSearch()

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">Search and filter your bookmarks</p>
      </div>

      {/* Search bar */}
      <SearchBar
        value={query}
        onChange={setQuery}
        onClear={clearSearch}
        resultCount={isActive ? total : undefined}
        isSearching={isSearching}
        recentSearches={recentSearches}
        onSelectRecent={setQuery}
        autoFocus
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Filters sidebar */}
        <aside className="lg:w-64 lg:shrink-0">
          <SearchFilters filters={filters} onFiltersChange={setFilters} />
        </aside>

        {/* Results */}
        <section className="min-w-0 flex-1">
          <SearchResults
            results={results}
            query={query}
            total={total}
            page={page}
            perPage={filters.per_page ?? 20}
            hasNextPage={hasNextPage}
            isSearching={isSearching}
            isActive={isActive}
            onPage={setPage}
          />
        </section>
      </div>
    </main>
  )
}
