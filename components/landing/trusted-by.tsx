import type { IconType } from "react-icons";
import { FaAmazon } from "react-icons/fa6";
import { SiAirbnb, SiCanva, SiGoogle, SiHubspot, SiSpotify } from "react-icons/si";

const brands: { Icon: IconType; label: string }[] = [
  { Icon: SiGoogle, label: "Google" },
  { Icon: SiAirbnb, label: "Airbnb" },
  { Icon: SiHubspot, label: "HubSpot" },
  { Icon: FaAmazon, label: "Amazon" },
  { Icon: SiCanva, label: "Canva" },
  { Icon: SiSpotify, label: "Spotify" },
];

export function TrustedBy() {
  return (
    <div
      className="py-10 sm:py-14"
      aria-labelledby="trusted-by-heading"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <h2
          id="trusted-by-heading"
          className="text-center text-[0.9375rem] font-medium tracking-tight text-slate-600 sm:text-base"
        >
          Trusted by 500+ brands worldwide
        </h2>
        <ul className="mt-8 flex list-none flex-wrap items-center justify-center gap-x-9 gap-y-7 sm:mt-9 sm:gap-x-11 md:gap-x-14 lg:gap-x-16">
          {brands.map(({ Icon, label }) => (
            <li key={label} className="flex items-center justify-center">
              <Icon
                aria-label={label}
                role="img"
                className="h-6 w-auto text-slate-500 sm:h-7 md:h-8"
                style={{ maxWidth: "7.5rem" }}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
