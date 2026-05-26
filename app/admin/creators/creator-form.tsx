"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createCreatorAction, updateCreatorAction } from "../actions";
import { Platform } from "@/data/mock-creators";
import { CREATOR_CATEGORIES } from "@/data/creator-categories";
import { X, Search, MapPin, ChevronDown } from "lucide-react";
import { Country, City, ICountry, ICity } from "country-state-city";

export function CreatorForm({ initialData, id }: { initialData?: any, id?: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 1. AI Intelligence State
  const [aiDescription, setAiDescription] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 2. Discovery Filters State (Chips)
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [filterSearch, setFilterSearch] = useState("");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // 3. Location State (Country & City)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");
  const [selectedCountryName, setSelectedCountryName] = useState<string>("");
  const [selectedCityName, setSelectedCityName] = useState<string>("");

  const [countrySearch, setCountrySearch] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  const [citySearch, setCitySearch] = useState("");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // 4. Platforms State
  const [platforms, setPlatforms] = useState<{name: Platform, followers: number, url: string}[]>(
    initialData?.platforms || [{ name: "Instagram", followers: 0, url: "" }]
  );

  // --- INITIALIZE LOCATION FROM DB ---
  useEffect(() => {
    if (initialData?.location) {
      // Expecting format "City, Country"
      const parts = initialData.location.split(", ");
      if (parts.length === 2) {
        const cityName = parts[0];
        const countryName = parts[1];
        
        const matchedCountry = Country.getAllCountries().find(c => c.name === countryName);
        if (matchedCountry) {
          setSelectedCountryCode(matchedCountry.isoCode);
          setSelectedCountryName(matchedCountry.name);
          setCountrySearch(matchedCountry.name);
          
          setSelectedCityName(cityName);
          setCitySearch(cityName);
        } else {
          setCountrySearch(initialData.location);
        }
      } else {
        setCountrySearch(initialData.location);
      }
    }
  }, [initialData]);

  // --- COUNTRY & CITY LOGIC ---
  const allCountries = useMemo(() => Country.getAllCountries(), []);
  
  const suggestedCountries = useMemo(() => {
    if (!countrySearch.trim()) {
      // Top 5 Countries if no search
      const topCodes = ["IN", "US", "GB", "CA", "AU"];
      return allCountries.filter(c => topCodes.includes(c.isoCode));
    }
    const query = countrySearch.toLowerCase();
    return allCountries.filter(c => c.name.toLowerCase().includes(query)).slice(0, 10);
  }, [countrySearch, allCountries]);

  const allCitiesForCountry = useMemo(() => {
    if (!selectedCountryCode) return [];
    return City.getCitiesOfCountry(selectedCountryCode) || [];
  }, [selectedCountryCode]);

  const suggestedCities = useMemo(() => {
    if (!citySearch.trim()) {
      return allCitiesForCountry.slice(0, 10);
    }
    const query = citySearch.toLowerCase();
    return allCitiesForCountry.filter(c => c.name.toLowerCase().includes(query)).slice(0, 10);
  }, [citySearch, allCitiesForCountry]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- AI LOGIC ---
  const handleAiCategorize = async () => {
    if (!aiDescription.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/admin/ai-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiDescription }),
      });
      const data = await res.json();
      if (data.tags && Array.isArray(data.tags)) {
        setTags(prev => Array.from(new Set([...prev, ...data.tags])));
      }
    } catch (error) {
      console.error(error);
      alert("Failed to analyze text with AI");
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- SMART FILTER LOGIC ---
  const allValidTags = useMemo(() => CREATOR_CATEGORIES.flatMap(g => g.subCategories), []);
  
  const suggestedFilters = useMemo(() => {
    if (!filterSearch.trim()) return [];
    const query = filterSearch.toLowerCase();
    return allValidTags.filter(tag => tag.toLowerCase().includes(query) && !tags.includes(tag)).slice(0, 8);
  }, [filterSearch, tags, allValidTags]);

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setFilterSearch("");
    setIsFilterDropdownOpen(false);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // --- PLATFORMS LOGIC ---
  const handlePlatformChange = (index: number, field: string, value: string | number) => {
    const newPlatforms = [...platforms];
    newPlatforms[index] = { ...newPlatforms[index], [field]: value };
    setPlatforms(newPlatforms);
  };

  const addPlatform = () => {
    setPlatforms([...platforms, { name: "Instagram", followers: 0, url: "" }]);
  };

  const removePlatform = (index: number) => {
    setPlatforms(platforms.filter((_, i) => i !== index));
  };

  // --- SUBMIT LOGIC ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate Location
    if (!selectedCountryName) {
      alert("Please select a Country.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    // Combine City and Country for Database compatibility
    let finalLocation = selectedCountryName;
    if (selectedCityName) {
      finalLocation = `${selectedCityName}, ${selectedCountryName}`;
    }
    formData.append("location", finalLocation);

    formData.append("platforms_json", JSON.stringify(platforms));
    formData.append("tags_json", JSON.stringify(tags));
    
    try {
      if (id) {
        await updateCreatorAction(id, formData);
      } else {
        await createCreatorAction(formData);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save creator.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-4xl mx-auto">
      
      {/* 1. AI Creator Intelligence */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
           <Search className="w-24 h-24" />
        </div>
        <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2 tracking-wide uppercase">
          <span className="text-lg">✨</span> AI Creator Intelligence
        </h3>
        <p className="text-sm text-indigo-700/80 mb-4 max-w-2xl">
          Paste the creator's bio, media kit summary, or personal description. Gemini will automatically extract their niche and select the perfect Discovery filters.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            value={aiDescription}
            onChange={(e) => setAiDescription(e.target.value)}
            rows={3}
            className="block w-full rounded-lg border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-indigo-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm resize-none bg-white/60 backdrop-blur-sm z-10"
            placeholder='e.g. "Food blogger from Delhi sharing healthy vegan recipes and coffee cafe vlogs"'
          />
          <button
            type="button"
            onClick={handleAiCategorize}
            disabled={isAiLoading || !aiDescription.trim()}
            className="whitespace-nowrap rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 h-fit transition-all z-10"
          >
            {isAiLoading ? "Analyzing..." : "Auto-Tag Creator"}
          </button>
        </div>
      </section>

      <div className="w-full h-px bg-slate-100"></div>

      {/* 2. Basic Creator Information */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Basic Information</h3>
        <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">Display Name</label>
            <input type="text" name="name" id="name" required defaultValue={initialData?.name} className="mt-2 block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm" placeholder="e.g. Elena Rodriguez" />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700">Primary Handle</label>
            <input type="text" name="username" id="username" required defaultValue={initialData?.username || initialData?.handle} className="mt-2 block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm" placeholder="e.g. @elenastyles" />
          </div>

          {/* Smart Country Selector */}
          <div className="relative" ref={countryDropdownRef}>
            <label className="block text-sm font-medium text-slate-700">Country</label>
            <div className="relative mt-2">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => {
                  setCountrySearch(e.target.value);
                  setIsCountryDropdownOpen(true);
                  if (e.target.value !== selectedCountryName) {
                    setSelectedCountryCode("");
                    setSelectedCountryName("");
                    setSelectedCityName("");
                    setCitySearch("");
                  }
                }}
                onFocus={() => setIsCountryDropdownOpen(true)}
                className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm"
                placeholder="Search country..."
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            
            {isCountryDropdownOpen && (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 sm:text-sm">
                {suggestedCountries.length > 0 ? (
                  suggestedCountries.map((country) => (
                    <button
                      key={country.isoCode}
                      type="button"
                      onClick={() => {
                        setSelectedCountryCode(country.isoCode);
                        setSelectedCountryName(country.name);
                        setCountrySearch(country.name);
                        setIsCountryDropdownOpen(false);
                      }}
                      className="relative flex w-full cursor-pointer select-none items-center py-2 px-4 text-slate-900 hover:bg-violet-50 hover:text-violet-900 transition-colors"
                    >
                      <span className="mr-2 text-lg">{country.flag}</span>
                      <span className="block truncate font-medium">{country.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="relative cursor-default select-none py-2 px-4 text-slate-500">
                    No matching countries found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Smart City Selector */}
          <div className="relative" ref={cityDropdownRef}>
            <label className="block text-sm font-medium text-slate-700">City / Region <span className="text-slate-400 font-normal">(Optional)</span></label>
            <div className="relative mt-2">
              <input
                type="text"
                disabled={!selectedCountryCode}
                value={citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  setIsCityDropdownOpen(true);
                  if (e.target.value !== selectedCityName) {
                    setSelectedCityName("");
                  }
                }}
                onFocus={() => {
                  if (selectedCountryCode) setIsCityDropdownOpen(true);
                }}
                className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                placeholder={selectedCountryCode ? "Search city..." : "Select country first"}
              />
              {selectedCountryCode && <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />}
            </div>
            
            {isCityDropdownOpen && selectedCountryCode && (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 sm:text-sm">
                {suggestedCities.length > 0 ? (
                  suggestedCities.map((city, idx) => (
                    <button
                      key={`${city.name}-${idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedCityName(city.name);
                        setCitySearch(city.name);
                        setIsCityDropdownOpen(false);
                      }}
                      className="relative flex w-full cursor-pointer select-none items-center py-2 px-4 text-slate-900 hover:bg-violet-50 hover:text-violet-900 transition-colors"
                    >
                      <span className="block truncate font-medium">{city.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="relative cursor-default select-none py-2 px-4 text-slate-500">
                    No matching cities found.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="bio" className="block text-sm font-medium text-slate-700">Public Bio</label>
            <textarea name="bio" id="bio" rows={3} defaultValue={initialData?.bio} className="mt-2 block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm" placeholder="A brief description for their public profile..."></textarea>
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-slate-100"></div>

      {/* 3. Discovery Filters & Tags */}
      <section>
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Discovery Filters</h3>
            <p className="text-sm text-slate-500 mt-1">Tags determine where this creator appears in search.</p>
          </div>
        </div>

        {/* Selected Chips */}
        <div className="flex flex-wrap gap-2 mb-4 min-h-[2.5rem] p-3 rounded-lg bg-slate-50 border border-slate-200/60">
          {tags.length === 0 ? (
            <span className="text-sm text-slate-400 my-auto ml-1">No filters selected. Use AI or search to add some.</span>
          ) : (
            tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-800 shadow-sm border border-violet-200">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="text-violet-600 hover:text-violet-900 rounded-full hover:bg-violet-200 p-0.5 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Smart Search Combobox */}
        <div className="relative" ref={filterDropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => {
                setFilterSearch(e.target.value);
                setIsFilterDropdownOpen(true);
              }}
              onFocus={() => setIsFilterDropdownOpen(true)}
              className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm"
              placeholder="Search & add manual filters (e.g., 'vegan', 'tech')..."
            />
          </div>

          {/* Autocomplete Dropdown */}
          {isFilterDropdownOpen && filterSearch.trim() !== "" && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {suggestedFilters.length > 0 ? (
                suggestedFilters.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="relative flex w-full cursor-default select-none items-center py-2 pl-3 pr-9 text-slate-900 hover:bg-violet-50 hover:text-violet-900 transition-colors"
                  >
                    <span className="block truncate font-medium">{tag}</span>
                  </button>
                ))
              ) : (
                <div className="relative cursor-default select-none py-2 px-4 text-slate-500">
                  No matching filters found in master taxonomy.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="w-full h-px bg-slate-100"></div>

      {/* 4. Connected Platforms */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Connected Platforms</h3>
          <button type="button" onClick={addPlatform} className="text-sm text-violet-600 hover:text-violet-700 font-semibold bg-violet-50 px-3 py-1.5 rounded-lg transition-colors">
            + Add Platform
          </button>
        </div>

        <div className="space-y-4">
          {platforms.map((p, index) => (
            <div key={index} className="flex gap-4 items-start bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Platform</label>
                <select value={p.name} onChange={(e) => handlePlatformChange(index, "name", e.target.value)} className="block w-full rounded-md border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 sm:text-sm focus:ring-2 focus:ring-violet-600">
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="TikTok">TikTok</option>
                  <option value="X">X (Twitter)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Followers</label>
                <input type="number" value={p.followers} onChange={(e) => handlePlatformChange(index, "followers", parseInt(e.target.value) || 0)} className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 sm:text-sm focus:ring-2 focus:ring-violet-600" />
              </div>
              <div className="flex-[2]">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Profile URL</label>
                <input type="text" value={p.url} onChange={(e) => handlePlatformChange(index, "url", e.target.value)} className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 sm:text-sm focus:ring-2 focus:ring-violet-600" placeholder="https://..." />
              </div>
              {platforms.length > 1 && (
                <button type="button" onClick={() => removePlatform(index)} className="mt-7 text-slate-400 hover:text-red-600 transition-colors p-1">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="w-full h-px bg-slate-100"></div>

      {/* 5. Internal Notes */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Internal Notes (CRM)</h3>
        <p className="text-sm text-slate-500 mb-4">Private notes for your team. Not visible on the discovery page.</p>
        <textarea name="internal_notes" id="internal_notes" rows={4} defaultValue={initialData?.internal_notes} className="block w-full rounded-lg border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm bg-yellow-50/30" placeholder="e.g. Demands high rates. Prefers video over static posts..."></textarea>
      </section>

      <div className="flex items-center justify-end gap-x-6 border-t border-slate-200 pt-8 mt-8">
        <a href="/admin/creators" className="text-sm font-semibold leading-6 text-slate-600 hover:text-slate-900">Cancel</a>
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-slate-900 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50 transition-all">
          {isSubmitting ? "Saving to Database..." : "Complete Onboarding"}
        </button>
      </div>
    </form>
  );
}
