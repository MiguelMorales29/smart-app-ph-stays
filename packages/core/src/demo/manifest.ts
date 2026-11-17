import type { AmenitiesRow } from "../schemas/tables/index.js";
import { DEMO_IDS } from "./ids.js";

export interface DemoMediaManifestEntry {
  readonly brand: string;
  readonly folder: "banners" | "brand" | "photos";
  readonly name: string;
  readonly sourceSize: string;
  readonly files: readonly string[];
  readonly pickedFrom: string;
  readonly heroDescription: string;
  readonly altText: string;
}

export const DEMO_MEDIA_MANIFEST: readonly DemoMediaManifestEntry[] = [
  {
    "brand": "ulap-suites",
    "folder": "banners",
    "name": "hero-1",
    "sourceSize": "1376x768",
    "files": [
      "banners/hero-1-1376.webp",
      "banners/hero-1-800.webp"
    ],
    "pickedFrom": "Couple_watching_sunrise_from_bal#U2026_3766711c.jpg",
    "heroDescription": "Sunrise over Taal, coffee in hand",
    "altText": "Couple wrapped in a blanket on the balcony watching sunrise over Taal Lake and a sea of clouds"
  },
  {
    "brand": "ulap-suites",
    "folder": "banners",
    "name": "hero-2",
    "sourceSize": "1376x768",
    "files": [
      "banners/hero-2-1376.webp",
      "banners/hero-2-800.webp"
    ],
    "pickedFrom": "Guests_watching_movie_on_projector_63d670a0.jpg",
    "heroDescription": "Projector movie nights under fairy lights",
    "altText": "Projector movie corner with floor mattress, pillows, fairy lights and popcorn at night"
  },
  {
    "brand": "ulap-suites",
    "folder": "banners",
    "name": "hero-3",
    "sourceSize": "1376x768",
    "files": [
      "banners/hero-3-1376.webp",
      "banners/hero-3-800.webp"
    ],
    "pickedFrom": "People_playing_board_game_13f06766.jpg",
    "heroDescription": "Board games, snacks and the whole barkada",
    "altText": "Hands mid-game around a board game with snacks and a wooden block tower on a coffee table"
  },
  {
    "brand": "ulap-suites",
    "folder": "banners",
    "name": "brand-cover",
    "sourceSize": "1376x768",
    "files": [
      "banners/brand-cover-1376.webp",
      "banners/brand-cover-800.webp"
    ],
    "pickedFrom": "Creating_brand_cover_image_3532a87d.jpg",
    "heroDescription": "",
    "altText": "Ulap Suites cover: balcony with two coffee mugs overlooking Taal Lake and a sea of clouds at sunrise with the Ulap Suites logo"
  },
  {
    "brand": "ulap-suites",
    "folder": "brand",
    "name": "logo-in-context",
    "sourceSize": "1200x896",
    "files": [
      "brand/logo-in-context-1200.webp",
      "brand/logo-in-context-800.webp"
    ],
    "pickedFrom": "Ulap_Suites_logo_on_keytag_5741bff9.jpg",
    "heroDescription": "",
    "altText": "Ulap Suites wooden keytag and brass key beside a steaming mug on a wooden table by a lake-view window"
  },
  {
    "brand": "ulap-suites",
    "folder": "photos",
    "name": "property-1",
    "sourceSize": "1200x896",
    "files": [
      "photos/property-1-1200.webp",
      "photos/property-1-800.webp",
      "photos/property-1-400.webp"
    ],
    "pickedFrom": "Condo_building_exterior_view_73f6cf0c.jpg",
    "heroDescription": "",
    "altText": "Five-storey cream condo building at golden hour with balconies and pine trees"
  },
  {
    "brand": "ulap-suites",
    "folder": "photos",
    "name": "property-2",
    "sourceSize": "1200x896",
    "files": [
      "photos/property-2-1200.webp",
      "photos/property-2-800.webp",
      "photos/property-2-400.webp"
    ],
    "pickedFrom": "Condo_complex_aerial_view_morning_5ce12c02.jpg",
    "heroDescription": "",
    "altText": "Drone view of condo buildings around a blue pool with Taal Lake in the distance"
  },
  {
    "brand": "ulap-suites",
    "folder": "photos",
    "name": "property-3",
    "sourceSize": "1200x896",
    "files": [
      "photos/property-3-1200.webp",
      "photos/property-3-800.webp",
      "photos/property-3-400.webp"
    ],
    "pickedFrom": "Guests_swimming_in_outdoor_pool_eba4876d.jpg",
    "heroDescription": "",
    "altText": "Shared outdoor pool at dusk with lights on and guests swimming"
  },
  {
    "brand": "ulap-suites",
    "folder": "photos",
    "name": "studio-fog-1",
    "sourceSize": "1200x896",
    "files": [
      "photos/studio-fog-1-1200.webp",
      "photos/studio-fog-1-800.webp",
      "photos/studio-fog-1-400.webp"
    ],
    "pickedFrom": "Real_estate_listing_photograph_o#U2026_336a5903.jpg",
    "heroDescription": "",
    "altText": "Studio with fairy-light headboard, small sofa, projector screen, kitchenette and pine-tree window"
  },
  {
    "brand": "ulap-suites",
    "folder": "photos",
    "name": "studio-fog-2",
    "sourceSize": "1200x896",
    "files": [
      "photos/studio-fog-2-1200.webp",
      "photos/studio-fog-2-800.webp",
      "photos/studio-fog-2-400.webp"
    ],
    "pickedFrom": "Condo_interior_with_coffee_bar_89ec9352.jpg",
    "heroDescription": "",
    "altText": "Coffee bar, snack basket and a shelf of board games and books near the door"
  },
  {
    "brand": "ulap-suites",
    "folder": "photos",
    "name": "studio-fog-3",
    "sourceSize": "1200x896",
    "files": [
      "photos/studio-fog-3-1200.webp",
      "photos/studio-fog-3-800.webp",
      "photos/studio-fog-3-400.webp"
    ],
    "pickedFrom": "Breakfast_in_bed_condo_room_854aef96.jpg",
    "heroDescription": "",
    "altText": "Breakfast tray with pandesal and coffee on the queen bed in morning sun"
  },
  {
    "brand": "ulap-suites",
    "folder": "photos",
    "name": "studio-fog-4",
    "sourceSize": "1200x896",
    "files": [
      "photos/studio-fog-4-1200.webp",
      "photos/studio-fog-4-800.webp",
      "photos/studio-fog-4-400.webp"
    ],
    "pickedFrom": "Game_shelf_in_condo_interior_107f120d.jpg",
    "heroDescription": "",
    "altText": "Shelf with chess set, wooden block tower, card decks, puzzle and paperback books"
  },
  {
    "brand": "ulap-suites",
    "folder": "photos",
    "name": "studio-fog-5",
    "sourceSize": "1200x896",
    "files": [
      "photos/studio-fog-5-1200.webp",
      "photos/studio-fog-5-800.webp",
      "photos/studio-fog-5-400.webp"
    ],
    "pickedFrom": "Bathroom_photograph_in_condo_23036d55.jpg",
    "heroDescription": "",
    "altText": "Bathroom with rain shower, rolled towels, toiletry kit and a plant"
  },
  {
    "brand": "ulap-suites",
    "folder": "photos",
    "name": "studio-fog-6",
    "sourceSize": "1200x896",
    "files": [
      "photos/studio-fog-6-1200.webp",
      "photos/studio-fog-6-800.webp",
      "photos/studio-fog-6-400.webp"
    ],
    "pickedFrom": "Remote_work_desk_by_window_dc35ad80.jpg",
    "heroDescription": "",
    "altText": "Window desk with laptop, fiber modem and coffee, pine trees outside"
  },
  {
    "brand": "ulap-suites",
    "folder": "photos",
    "name": "studio-fog-7",
    "sourceSize": "1200x896",
    "files": [
      "photos/studio-fog-7-1200.webp",
      "photos/studio-fog-7-800.webp",
      "photos/studio-fog-7-400.webp"
    ],
    "pickedFrom": "Anniversary_surprise_setup_in_condo_c0195ba4.jpg",
    "heroDescription": "",
    "altText": "Anniversary setup with balloons, rose petals on the bed and a small cake"
  },
  {
    "brand": "ulap-suites",
    "folder": "photos",
    "name": "taal-view-1br-1",
    "sourceSize": "1200x896",
    "files": [
      "photos/taal-view-1br-1-1200.webp",
      "photos/taal-view-1br-1-800.webp",
      "photos/taal-view-1br-1-400.webp"
    ],
    "pickedFrom": "Real_estate_living_room_photograph_516430e0.jpg",
    "heroDescription": "",
    "altText": "Living room with sofa bed, TV, game console and a golden-hour Taal view"
  },
  {
    "brand": "ulap-suites",
    "folder": "photos",
    "name": "taal-view-1br-2",
    "sourceSize": "1200x896",
    "files": [
      "photos/taal-view-1br-2-1200.webp",
      "photos/taal-view-1br-2-800.webp",
      "photos/taal-view-1br-2-400.webp"
    ],
    "pickedFrom": "Real_estate_listing_photograph_i#U2026_9d446575.jpg",
    "heroDescription": "",
    "altText": "Unit seen from the balcony door: dining nook, kitchen, bedroom door and karaoke speaker"
  },
  {
    "brand": "ulap-suites",
    "folder": "photos",
    "name": "taal-view-1br-3",
    "sourceSize": "1200x896",
    "files": [
      "photos/taal-view-1br-3-1200.webp",
      "photos/taal-view-1br-3-800.webp",
      "photos/taal-view-1br-3-400.webp"
    ],
    "pickedFrom": "Condo_bedroom_with_lake_view_bcc2ad99.jpg",
    "heroDescription": "",
    "altText": "Bedroom with queen bed, wall lamp and lake view through the window"
  },
  {
    "brand": "ulap-suites",
    "folder": "photos",
    "name": "taal-view-1br-4",
    "sourceSize": "1200x896",
    "files": [
      "photos/taal-view-1br-4-1200.webp",
      "photos/taal-view-1br-4-800.webp",
      "photos/taal-view-1br-4-400.webp"
    ],
    "pickedFrom": "Friends_laughing_around_dining_t#U2026_a53f0b8f.jpg",
    "heroDescription": "",
    "altText": "Four friends playing cards at the dining table at sunset with snacks"
  },
  {
    "brand": "ulap-suites",
    "folder": "photos",
    "name": "taal-view-1br-5",
    "sourceSize": "1200x896",
    "files": [
      "photos/taal-view-1br-5-1200.webp",
      "photos/taal-view-1br-5-800.webp",
      "photos/taal-view-1br-5-400.webp"
    ],
    "pickedFrom": "Real_estate_kitchen_photo_fa97402e.jpg",
    "heroDescription": "",
    "altText": "Kitchen with cooktop, rice cooker, fridge and a coffee corner"
  },
  {
    "brand": "ulap-suites",
    "folder": "photos",
    "name": "taal-view-1br-6",
    "sourceSize": "1200x896",
    "files": [
      "photos/taal-view-1br-6-1200.webp",
      "photos/taal-view-1br-6-800.webp",
      "photos/taal-view-1br-6-400.webp"
    ],
    "pickedFrom": "Bathroom_photograph_in_condo_c9408a83.jpg",
    "heroDescription": "",
    "altText": "Bathroom with glass shower, water heater, rolled towels and toiletry kit"
  },
  {
    "brand": "ulap-suites",
    "folder": "photos",
    "name": "taal-view-1br-7",
    "sourceSize": "1200x896",
    "files": [
      "photos/taal-view-1br-7-1200.webp",
      "photos/taal-view-1br-7-800.webp",
      "photos/taal-view-1br-7-400.webp"
    ],
    "pickedFrom": "Balcony_overlooking_lake_at_sunset_f3318d6b.jpg",
    "heroDescription": "",
    "altText": "Balcony with rattan chairs and string lights at sunset over Taal Lake"
  },
  {
    "brand": "bahay-batis",
    "folder": "banners",
    "name": "hero-1",
    "sourceSize": "1376x768",
    "files": [
      "banners/hero-1-1376.webp",
      "banners/hero-1-800.webp"
    ],
    "pickedFrom": "Drone_photo_of_resort_property_a59bf6b9.jpg",
    "heroDescription": "A private hot-spring resort, just for your group",
    "altText": "Drone view of a private resort with guests in a teal pool, a slide, cabana and half court"
  },
  {
    "brand": "bahay-batis",
    "folder": "banners",
    "name": "hero-2",
    "sourceSize": "1376x768",
    "files": [
      "banners/hero-2-1376.webp",
      "banners/hero-2-800.webp"
    ],
    "pickedFrom": "Friends_singing_karaoke_at_night_0584a9a7.jpg",
    "heroDescription": "Night swims and videoke till late",
    "altText": "Friends singing videoke in the cabana at night beside a glowing pool"
  },
  {
    "brand": "bahay-batis",
    "folder": "banners",
    "name": "hero-3",
    "sourceSize": "1376x768",
    "files": [
      "banners/hero-3-1376.webp",
      "banners/hero-3-800.webp"
    ],
    "pickedFrom": "People_playing_billiards_at_resort_7f3659f2.jpg",
    "heroDescription": "Billiards, ping pong and a half court",
    "altText": "Billiards game in a covered game area with a ping pong table and the pool behind"
  },
  {
    "brand": "bahay-batis",
    "folder": "banners",
    "name": "brand-cover",
    "sourceSize": "1376x768",
    "files": [
      "banners/brand-cover-1376.webp",
      "banners/brand-cover-800.webp"
    ],
    "pickedFrom": "Creating_brand_cover_image_fa95b116.jpg",
    "heroDescription": "",
    "altText": "Bahay Batis cover: guests in a resort pool with a slide, nipa cabana and green hills behind with the Bahay Batis logo"
  },
  {
    "brand": "bahay-batis",
    "folder": "brand",
    "name": "logo-in-context",
    "sourceSize": "1200x896",
    "files": [
      "brand/logo-in-context-1200.webp",
      "brand/logo-in-context-800.webp"
    ],
    "pickedFrom": "Logo_embroidered_on_pool_towel_d8eacb40.jpg",
    "heroDescription": "",
    "altText": "Bahay Batis logo embroidered on a folded teal towel on a wooden table beside a steaming stone-edged pool"
  },
  {
    "brand": "bahay-batis",
    "folder": "photos",
    "name": "property-1",
    "sourceSize": "1200x896",
    "files": [
      "photos/property-1-1200.webp",
      "photos/property-1-800.webp",
      "photos/property-1-400.webp"
    ],
    "pickedFrom": "Real_estate_listing_photograph_e#U2026_8b4ea8d7.jpg",
    "heroDescription": "",
    "altText": "Front gate and high wall of the private resort with bougainvillea and coconut trees"
  },
  {
    "brand": "bahay-batis",
    "folder": "photos",
    "name": "property-2",
    "sourceSize": "1200x896",
    "files": [
      "photos/property-2-1200.webp",
      "photos/property-2-800.webp",
      "photos/property-2-400.webp"
    ],
    "pickedFrom": "Teenagers_playing_basketball_out#U2026_4288a64e.jpg",
    "heroDescription": "",
    "altText": "Half basketball court and ping pong table with teenagers playing"
  },
  {
    "brand": "bahay-batis",
    "folder": "photos",
    "name": "property-3",
    "sourceSize": "1200x896",
    "files": [
      "photos/property-3-1200.webp",
      "photos/property-3-800.webp",
      "photos/property-3-400.webp"
    ],
    "pickedFrom": "Spring_water_pouring_into_pool_137ee1bc.jpg",
    "heroDescription": "",
    "altText": "Warm spring water pouring from a stone spout into the pool"
  },
  {
    "brand": "bahay-batis",
    "folder": "photos",
    "name": "buong-bahay-1",
    "sourceSize": "1200x896",
    "files": [
      "photos/buong-bahay-1-1200.webp",
      "photos/buong-bahay-1-800.webp",
      "photos/buong-bahay-1-400.webp"
    ],
    "pickedFrom": "Living_room_open_to_pool_240eac1d.jpg",
    "heroDescription": "",
    "altText": "Living room with L-shaped sofa and videoke set, open to the pool"
  },
  {
    "brand": "bahay-batis",
    "folder": "photos",
    "name": "buong-bahay-2",
    "sourceSize": "1200x896",
    "files": [
      "photos/buong-bahay-2-1200.webp",
      "photos/buong-bahay-2-800.webp",
      "photos/buong-bahay-2-400.webp"
    ],
    "pickedFrom": "Real_estate_listing_photograph_o#U2026_f6021a45.jpg",
    "heroDescription": "",
    "altText": "House seen from the pool deck through open sliding doors, long dining table inside"
  },
  {
    "brand": "bahay-batis",
    "folder": "photos",
    "name": "buong-bahay-3",
    "sourceSize": "1200x896",
    "files": [
      "photos/buong-bahay-3-1200.webp",
      "photos/buong-bahay-3-800.webp",
      "photos/buong-bahay-3-400.webp"
    ],
    "pickedFrom": "Billiards_table_in_game_room_779bf6e6.jpg",
    "heroDescription": "",
    "altText": "Game room with a billiards table racked and ready and a ping pong table"
  },
  {
    "brand": "bahay-batis",
    "folder": "photos",
    "name": "buong-bahay-4",
    "sourceSize": "1200x896",
    "files": [
      "photos/buong-bahay-4-1200.webp",
      "photos/buong-bahay-4-800.webp",
      "photos/buong-bahay-4-400.webp"
    ],
    "pickedFrom": "Family_bunk_room_with_beds_1e838366.jpg",
    "heroDescription": "",
    "altText": "Air-conditioned bunk room with two double-deck beds, a queen bed and towels"
  },
  {
    "brand": "bahay-batis",
    "folder": "photos",
    "name": "buong-bahay-5",
    "sourceSize": "1200x896",
    "files": [
      "photos/buong-bahay-5-1200.webp",
      "photos/buong-bahay-5-800.webp",
      "photos/buong-bahay-5-400.webp"
    ],
    "pickedFrom": "Grilling_food_at_resort_house_a504facf.jpg",
    "heroDescription": "",
    "altText": "Charcoal grill with pork belly and skewers smoking at sunset"
  },
  {
    "brand": "bahay-batis",
    "folder": "photos",
    "name": "buong-bahay-6",
    "sourceSize": "1200x896",
    "files": [
      "photos/buong-bahay-6-1200.webp",
      "photos/buong-bahay-6-800.webp",
      "photos/buong-bahay-6-400.webp"
    ],
    "pickedFrom": "Kitchen_in_resort_house_557d204c.jpg",
    "heroDescription": "",
    "altText": "Large kitchen with long island, rice cookers and plates for twenty"
  },
  {
    "brand": "bahay-batis",
    "folder": "photos",
    "name": "buong-bahay-7",
    "sourceSize": "1200x896",
    "files": [
      "photos/buong-bahay-7-1200.webp",
      "photos/buong-bahay-7-800.webp",
      "photos/buong-bahay-7-400.webp"
    ],
    "pickedFrom": "Children_playing_in_pool_32e85ce7.jpg",
    "heroDescription": "",
    "altText": "Kiddie pool with a small slide, children splashing and parents at the edge"
  },
  {
    "brand": "ilaw-residences",
    "folder": "banners",
    "name": "hero-1",
    "sourceSize": "1376x768",
    "files": [
      "banners/hero-1-1376.webp",
      "banners/hero-1-800.webp"
    ],
    "pickedFrom": "Tenant_arriving_on_bicycle_building_e5da9225.jpg",
    "heroDescription": "Twelve homes, one lit window at a time",
    "altText": "Five-storey white apartment building at blue hour with lit windows and a tenant on a bicycle"
  },
  {
    "brand": "ilaw-residences",
    "folder": "banners",
    "name": "hero-2",
    "sourceSize": "1376x768",
    "files": [
      "banners/hero-2-1376.webp",
      "banners/hero-2-800.webp"
    ],
    "pickedFrom": "Tenants_chatting_on_rooftop_deck_753dfcee.jpg",
    "heroDescription": "A rooftop for after work",
    "altText": "Tenants chatting on the rooftop deck at dusk under string lights with a city skyline"
  },
  {
    "brand": "ilaw-residences",
    "folder": "banners",
    "name": "hero-3",
    "sourceSize": "1376x768",
    "files": [
      "banners/hero-3-1376.webp",
      "banners/hero-3-800.webp"
    ],
    "pickedFrom": "Woman_cooking_in_apartment_evening_ca578481.jpg",
    "heroDescription": "Warm, quiet homes near Ortigas, pets welcome",
    "altText": "One-bedroom unit in the evening with someone cooking, dinner on the table and a dog on a rug"
  },
  {
    "brand": "ilaw-residences",
    "folder": "banners",
    "name": "brand-cover",
    "sourceSize": "1376x768",
    "files": [
      "banners/brand-cover-1376.webp",
      "banners/brand-cover-800.webp"
    ],
    "pickedFrom": "Apartment_building_cover_image_c#U2026_1ed97543.jpg",
    "heroDescription": "",
    "altText": "Ilaw Residences cover: five-storey apartment building at dusk with warm lit windows and rooftop lights with the Ilaw Residences logo"
  },
  {
    "brand": "ilaw-residences",
    "folder": "brand",
    "name": "logo-in-context",
    "sourceSize": "1200x896",
    "files": [
      "brand/logo-in-context-1200.webp",
      "brand/logo-in-context-800.webp"
    ],
    "pickedFrom": "Creating_Ilaw_Residences_logo_photo_519fd8ce.jpg",
    "heroDescription": "",
    "altText": "Ilaw Residences backlit sign on a white wall beside the glass lobby entrance, potted plants and a bike rack"
  },
  {
    "brand": "ilaw-residences",
    "folder": "photos",
    "name": "property-1",
    "sourceSize": "1200x896",
    "files": [
      "photos/property-1-1200.webp",
      "photos/property-1-800.webp",
      "photos/property-1-400.webp"
    ],
    "pickedFrom": "Building_exterior_viewed_from_above_aee3110b.jpg",
    "heroDescription": "",
    "altText": "Drone view of the white apartment building with rooftop deck on a tree-lined street"
  },
  {
    "brand": "ilaw-residences",
    "folder": "photos",
    "name": "property-2",
    "sourceSize": "1200x896",
    "files": [
      "photos/property-2-1200.webp",
      "photos/property-2-800.webp",
      "photos/property-2-400.webp"
    ],
    "pickedFrom": "Apartment_lobby_in_morning_15b62bbf.jpg",
    "heroDescription": "",
    "altText": "Lobby with ink-blue mailboxes, keycard reader, bike rack and a CCTV camera"
  },
  {
    "brand": "ilaw-residences",
    "folder": "photos",
    "name": "property-3",
    "sourceSize": "1200x896",
    "files": [
      "photos/property-3-1200.webp",
      "photos/property-3-800.webp",
      "photos/property-3-400.webp"
    ],
    "pickedFrom": "Real_estate_listing_photograph_a#U2026_4e4220ec.jpg",
    "heroDescription": "",
    "altText": "Busy neighbourhood food strip at night with outdoor tables and warm lights"
  },
  {
    "brand": "ilaw-residences",
    "folder": "photos",
    "name": "studio-a-1",
    "sourceSize": "1200x896",
    "files": [
      "photos/studio-a-1-1200.webp",
      "photos/studio-a-1-800.webp",
      "photos/studio-a-1-400.webp"
    ],
    "pickedFrom": "Real_estate_studio_apartment_pho#U2026_2770dd3f.jpg",
    "heroDescription": "",
    "altText": "Studio with double bed, deep ink-blue accent wall, kitchenette and plants in afternoon sun"
  },
  {
    "brand": "ilaw-residences",
    "folder": "photos",
    "name": "studio-a-2",
    "sourceSize": "1200x896",
    "files": [
      "photos/studio-a-2-1200.webp",
      "photos/studio-a-2-800.webp",
      "photos/studio-a-2-400.webp"
    ],
    "pickedFrom": "Real_estate_apartment_photograph#U2026_f82c92e1.jpg",
    "heroDescription": "",
    "altText": "Studio seen from the window toward the door, kitchenette and bathroom door"
  },
  {
    "brand": "ilaw-residences",
    "folder": "photos",
    "name": "studio-a-3",
    "sourceSize": "1200x896",
    "files": [
      "photos/studio-a-3-1200.webp",
      "photos/studio-a-3-800.webp",
      "photos/studio-a-3-400.webp"
    ],
    "pickedFrom": "Laptop_on_desk_at_window_6844a325.jpg",
    "heroDescription": "",
    "altText": "Work desk with laptop, second monitor and fiber modem by the window"
  },
  {
    "brand": "ilaw-residences",
    "folder": "photos",
    "name": "studio-a-4",
    "sourceSize": "1200x896",
    "files": [
      "photos/studio-a-4-1200.webp",
      "photos/studio-a-4-800.webp",
      "photos/studio-a-4-400.webp"
    ],
    "pickedFrom": "Kitchenette_in_apartment_interior_d6312be7.jpg",
    "heroDescription": "",
    "altText": "Kitchenette with induction burner, small fridge, sink and open shelves"
  },
  {
    "brand": "ilaw-residences",
    "folder": "photos",
    "name": "studio-a-5",
    "sourceSize": "1200x896",
    "files": [
      "photos/studio-a-5-1200.webp",
      "photos/studio-a-5-800.webp",
      "photos/studio-a-5-400.webp"
    ],
    "pickedFrom": "Compact_bathroom_real_estate_pho#U2026_0904cd45.jpg",
    "heroDescription": "",
    "altText": "Compact bathroom with shower, water heater, mirror cabinet and towels"
  },
  {
    "brand": "ilaw-residences",
    "folder": "photos",
    "name": "studio-a-6",
    "sourceSize": "1200x896",
    "files": [
      "photos/studio-a-6-1200.webp",
      "photos/studio-a-6-800.webp",
      "photos/studio-a-6-400.webp"
    ],
    "pickedFrom": "Dog_sleeping_on_pet_bed_e104181a.jpg",
    "heroDescription": "",
    "altText": "Small dog asleep on a pet bed by the sofa in the sun"
  },
  {
    "brand": "ilaw-residences",
    "folder": "photos",
    "name": "one-br-b-1",
    "sourceSize": "1200x896",
    "files": [
      "photos/one-br-b-1-1200.webp",
      "photos/one-br-b-1-800.webp",
      "photos/one-br-b-1-400.webp"
    ],
    "pickedFrom": "Living_area_photograph_with_sofa_bcfad9c8.jpg",
    "heroDescription": "",
    "altText": "Living area with ink-blue sofa, round dining table and open balcony door in afternoon sun"
  },
  {
    "brand": "ilaw-residences",
    "folder": "photos",
    "name": "one-br-b-2",
    "sourceSize": "1200x896",
    "files": [
      "photos/one-br-b-2-1200.webp",
      "photos/one-br-b-2-800.webp",
      "photos/one-br-b-2-400.webp"
    ],
    "pickedFrom": "Apartment_interior_view_photograph_8ab03e20.jpg",
    "heroDescription": "",
    "altText": "Unit seen from the balcony door: living area, kitchen and bedroom door"
  },
  {
    "brand": "ilaw-residences",
    "folder": "photos",
    "name": "one-br-b-3",
    "sourceSize": "1200x896",
    "files": [
      "photos/one-br-b-3-1200.webp",
      "photos/one-br-b-3-800.webp",
      "photos/one-br-b-3-400.webp"
    ],
    "pickedFrom": "Apartment_bedroom_with_queen_bed_3a574789.jpg",
    "heroDescription": "",
    "altText": "Bedroom with queen bed, built-in wardrobe, air conditioner and reading lamp"
  },
  {
    "brand": "ilaw-residences",
    "folder": "photos",
    "name": "one-br-b-4",
    "sourceSize": "1200x896",
    "files": [
      "photos/one-br-b-4-1200.webp",
      "photos/one-br-b-4-800.webp",
      "photos/one-br-b-4-400.webp"
    ],
    "pickedFrom": "Kitchen_cooktop_in_small_apartment_bf7422b8.jpg",
    "heroDescription": "",
    "altText": "Kitchen with two-burner cooktop, range hood, microwave and rice cooker"
  },
  {
    "brand": "ilaw-residences",
    "folder": "photos",
    "name": "one-br-b-5",
    "sourceSize": "1200x896",
    "files": [
      "photos/one-br-b-5-1200.webp",
      "photos/one-br-b-5-800.webp",
      "photos/one-br-b-5-400.webp"
    ],
    "pickedFrom": "Bathroom_interior_of_apartment_d43ac72e.jpg",
    "heroDescription": "",
    "altText": "Bathroom with glass shower panel, water heater and folded towels"
  },
  {
    "brand": "ilaw-residences",
    "folder": "photos",
    "name": "one-br-b-6",
    "sourceSize": "1200x896",
    "files": [
      "photos/one-br-b-6-1200.webp",
      "photos/one-br-b-6-800.webp",
      "photos/one-br-b-6-400.webp"
    ],
    "pickedFrom": "Apartment_balcony_with_coffee_mug_4f193954.jpg",
    "heroDescription": "",
    "altText": "Small balcony with folding chair, coffee and potted herbs in the morning"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "banners",
    "name": "hero-1",
    "sourceSize": "1376x768",
    "files": [
      "banners/hero-1-1376.webp",
      "banners/hero-1-800.webp"
    ],
    "pickedFrom": "Students_walking_outside_dorm_bu#U2026_d2a2ff51.jpg",
    "heroDescription": "Five minutes to campus, safe all night",
    "altText": "Students leaving the dorm gate in the morning with backpacks, a jeepney passing"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "banners",
    "name": "hero-2",
    "sourceSize": "1376x768",
    "files": [
      "banners/hero-2-1376.webp",
      "banners/hero-2-800.webp"
    ],
    "pickedFrom": "Students_studying_in_night_hall_03dcf7be.jpg",
    "heroDescription": "A study hall that never closes",
    "altText": "Students studying late at night at long tables with desk lamps in the study hall"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "banners",
    "name": "hero-3",
    "sourceSize": "1376x768",
    "files": [
      "banners/hero-3-1376.webp",
      "banners/hero-3-800.webp"
    ],
    "pickedFrom": "Residents_cooking_in_boarding_ho#U2026_3483a0e6.jpg",
    "heroDescription": "A kitchen that feels like home",
    "altText": "Residents cooking and laughing together in the common kitchen in the evening"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "banners",
    "name": "brand-cover",
    "sourceSize": "1376x768",
    "files": [
      "banners/brand-cover-1376.webp",
      "banners/brand-cover-800.webp"
    ],
    "pickedFrom": "Designing_brand_cover_image_3ea2c8aa.jpg",
    "heroDescription": "",
    "altText": "Tita Lorna's Dorm cover: students walking past the blue dorm gate with a passing jeepney and the Tita Lorna's Dorm logo"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "brand",
    "name": "logo-in-context",
    "sourceSize": "1200x896",
    "files": [
      "brand/logo-in-context-1200.webp",
      "brand/logo-in-context-800.webp"
    ],
    "pickedFrom": "Sign_displaying_dorm_logo_aaffc82f.jpg",
    "heroDescription": "",
    "altText": "Tita Lorna's Dorm sign mounted on a blue metal gate beside potted plants, a door scanner and a parked bicycle"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "photos",
    "name": "property-1",
    "sourceSize": "1200x896",
    "files": [
      "photos/property-1-1200.webp",
      "photos/property-1-800.webp",
      "photos/property-1-400.webp"
    ],
    "pickedFrom": "Students_walking_on_Sampaloc_street_aee77a9d.jpg",
    "heroDescription": "",
    "altText": "Narrow street outside the dorm with tricycles, a corner store and students walking"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "photos",
    "name": "property-2",
    "sourceSize": "1200x896",
    "files": [
      "photos/property-2-1200.webp",
      "photos/property-2-800.webp",
      "photos/property-2-400.webp"
    ],
    "pickedFrom": "Student_boarding_house_interior_023faa68.jpg",
    "heroDescription": "",
    "altText": "Entrance with biometric scanner, CCTV camera, logbook desk and shoe rack"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "photos",
    "name": "property-3",
    "sourceSize": "1200x896",
    "files": [
      "photos/property-3-1200.webp",
      "photos/property-3-800.webp",
      "photos/property-3-400.webp"
    ],
    "pickedFrom": "Students_playing_ping_pong_in_818266d1.jpg",
    "heroDescription": "",
    "altText": "Lounge with two students playing ping pong, a sofa and a TV"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "photos",
    "name": "room-2a-ladies-1",
    "sourceSize": "1200x896",
    "files": [
      "photos/room-2a-ladies-1-1200.webp",
      "photos/room-2a-ladies-1-800.webp",
      "photos/room-2a-ladies-1-400.webp"
    ],
    "pickedFrom": "Student_dormitory_room_interior_#U2026_8056d9c6.jpg",
    "heroDescription": "",
    "altText": "Room with two bunk beds, four beds in total, privacy curtains, fairy lights and air-con"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "photos",
    "name": "room-2a-ladies-2",
    "sourceSize": "1200x896",
    "files": [
      "photos/room-2a-ladies-2-1200.webp",
      "photos/room-2a-ladies-2-800.webp",
      "photos/room-2a-ladies-2-400.webp"
    ],
    "pickedFrom": "Student_dorm_room_interior_photo#U2026_75016126.jpg",
    "heroDescription": "",
    "altText": "Four numbered lockers, a mirror and the ends of both bunk beds"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "photos",
    "name": "room-2a-ladies-3",
    "sourceSize": "1200x896",
    "files": [
      "photos/room-2a-ladies-3-1200.webp",
      "photos/room-2a-ladies-3-800.webp",
      "photos/room-2a-ladies-3-400.webp"
    ],
    "pickedFrom": "Bunk_bed_in_student_dorm_d795fadb.jpg",
    "heroDescription": "",
    "altText": "Lower bunk with curtain, reading light, charging outlet, laptop and plush toy"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "photos",
    "name": "room-2a-ladies-4",
    "sourceSize": "1200x896",
    "files": [
      "photos/room-2a-ladies-4-1200.webp",
      "photos/room-2a-ladies-4-800.webp",
      "photos/room-2a-ladies-4-400.webp"
    ],
    "pickedFrom": "Students_studying_in_dorm_room_cddedbd7.jpg",
    "heroDescription": "",
    "altText": "Two students studying at wooden desks under the window"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "photos",
    "name": "room-2a-ladies-5",
    "sourceSize": "1200x896",
    "files": [
      "photos/room-2a-ladies-5-1200.webp",
      "photos/room-2a-ladies-5-800.webp",
      "photos/room-2a-ladies-5-400.webp"
    ],
    "pickedFrom": "Ladies_bathroom_in_student_boarding_ca5eb1d1.jpg",
    "heroDescription": "",
    "altText": "Shared bathroom with two shower stalls, water heaters and two sinks"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "photos",
    "name": "room-2a-ladies-6",
    "sourceSize": "1200x896",
    "files": [
      "photos/room-2a-ladies-6-1200.webp",
      "photos/room-2a-ladies-6-800.webp",
      "photos/room-2a-ladies-6-400.webp"
    ],
    "pickedFrom": "Locker_with_towel_and_lanyard_ec56f055.jpg",
    "heroDescription": "",
    "altText": "Numbered metal locker with a padlock and a lanyard"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "photos",
    "name": "room-3b-gents-1",
    "sourceSize": "1200x896",
    "files": [
      "photos/room-3b-gents-1-1200.webp",
      "photos/room-3b-gents-1-800.webp",
      "photos/room-3b-gents-1-400.webp"
    ],
    "pickedFrom": "Student_dormitory_room_in_mornin#U2026_b5f86f71.jpg",
    "heroDescription": "",
    "altText": "Room with three bunk beds, six beds in total, air conditioner and a large window"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "photos",
    "name": "room-3b-gents-2",
    "sourceSize": "1200x896",
    "files": [
      "photos/room-3b-gents-2-1200.webp",
      "photos/room-3b-gents-2-800.webp",
      "photos/room-3b-gents-2-400.webp"
    ],
    "pickedFrom": "Student_boarding_house_interior_#U2026_85d5352c.jpg",
    "heroDescription": "",
    "altText": "Aisle between the bunk beds to a sunny window, backpacks on posts"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "photos",
    "name": "room-3b-gents-3",
    "sourceSize": "1200x896",
    "files": [
      "photos/room-3b-gents-3-1200.webp",
      "photos/room-3b-gents-3-800.webp",
      "photos/room-3b-gents-3-400.webp"
    ],
    "pickedFrom": "Dorm_room_upper_bunk_photo_dcc1d113.jpg",
    "heroDescription": "",
    "altText": "Upper bunk with ladder, clip-on fan, reading light and organiser"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "photos",
    "name": "room-3b-gents-4",
    "sourceSize": "1200x896",
    "files": [
      "photos/room-3b-gents-4-1200.webp",
      "photos/room-3b-gents-4-800.webp",
      "photos/room-3b-gents-4-400.webp"
    ],
    "pickedFrom": "Students_studying_at_desk_ef1f1790.jpg",
    "heroDescription": "",
    "altText": "Three students at a row of study desks with lamps and a bookshelf"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "photos",
    "name": "room-3b-gents-5",
    "sourceSize": "1200x896",
    "files": [
      "photos/room-3b-gents-5-1200.webp",
      "photos/room-3b-gents-5-800.webp",
      "photos/room-3b-gents-5-400.webp"
    ],
    "pickedFrom": "Student_folding_laundry_on_rooftop_d201e78d.jpg",
    "heroDescription": "",
    "altText": "Rooftop laundry with washing machines, drying clothes and the city at sunset"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "photos",
    "name": "room-3b-gents-6",
    "sourceSize": "1200x896",
    "files": [
      "photos/room-3b-gents-6-1200.webp",
      "photos/room-3b-gents-6-800.webp",
      "photos/room-3b-gents-6-400.webp"
    ],
    "pickedFrom": "Bathroom_in_student_boarding_house_e5c92b32.jpg",
    "heroDescription": "",
    "altText": "Shared bathroom with two shower stalls and two sinks"
  },
  {
    "brand": "ulap-suites",
    "folder": "brand",
    "name": "logo-symbol",
    "sourceSize": "vector",
    "files": [
      "brand/logo-symbol.svg",
      "brand/logo-symbol-1024.webp",
      "brand/logo-symbol-256.webp",
      "brand/logo-symbol-128.webp"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Ulap Suites logo symbol"
  },
  {
    "brand": "ulap-suites",
    "folder": "brand",
    "name": "logo-lockup",
    "sourceSize": "vector",
    "files": [
      "brand/logo-lockup.svg",
      "brand/logo-lockup-2000.webp",
      "brand/logo-lockup-800.webp",
      "brand/logo-lockup-400.webp"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Ulap Suites logo"
  },
  {
    "brand": "ulap-suites",
    "folder": "brand",
    "name": "app-icon",
    "sourceSize": "vector",
    "files": [
      "brand/app-icon.svg",
      "brand/icon-192.png",
      "brand/icon-512.png",
      "brand/icon-512.webp",
      "brand/apple-touch-icon-180.png"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Ulap Suites app icon"
  },
  {
    "brand": "ulap-suites",
    "folder": "brand",
    "name": "brand-board",
    "sourceSize": "vector",
    "files": [
      "brand/brand-board-1600.webp"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Ulap Suites brand board: logo, colours and fonts"
  },
  {
    "brand": "bahay-batis",
    "folder": "brand",
    "name": "logo-symbol",
    "sourceSize": "vector",
    "files": [
      "brand/logo-symbol.svg",
      "brand/logo-symbol-1024.webp",
      "brand/logo-symbol-256.webp",
      "brand/logo-symbol-128.webp"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Bahay Batis logo symbol"
  },
  {
    "brand": "bahay-batis",
    "folder": "brand",
    "name": "logo-lockup",
    "sourceSize": "vector",
    "files": [
      "brand/logo-lockup.svg",
      "brand/logo-lockup-2000.webp",
      "brand/logo-lockup-800.webp",
      "brand/logo-lockup-400.webp"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Bahay Batis logo"
  },
  {
    "brand": "bahay-batis",
    "folder": "brand",
    "name": "app-icon",
    "sourceSize": "vector",
    "files": [
      "brand/app-icon.svg",
      "brand/icon-192.png",
      "brand/icon-512.png",
      "brand/icon-512.webp",
      "brand/apple-touch-icon-180.png"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Bahay Batis app icon"
  },
  {
    "brand": "bahay-batis",
    "folder": "brand",
    "name": "brand-board",
    "sourceSize": "vector",
    "files": [
      "brand/brand-board-1600.webp"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Bahay Batis brand board: logo, colours and fonts"
  },
  {
    "brand": "ilaw-residences",
    "folder": "brand",
    "name": "logo-symbol",
    "sourceSize": "vector",
    "files": [
      "brand/logo-symbol.svg",
      "brand/logo-symbol-1024.webp",
      "brand/logo-symbol-256.webp",
      "brand/logo-symbol-128.webp"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Ilaw Residences logo symbol"
  },
  {
    "brand": "ilaw-residences",
    "folder": "brand",
    "name": "logo-lockup",
    "sourceSize": "vector",
    "files": [
      "brand/logo-lockup.svg",
      "brand/logo-lockup-2000.webp",
      "brand/logo-lockup-800.webp",
      "brand/logo-lockup-400.webp"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Ilaw Residences logo"
  },
  {
    "brand": "ilaw-residences",
    "folder": "brand",
    "name": "app-icon",
    "sourceSize": "vector",
    "files": [
      "brand/app-icon.svg",
      "brand/icon-192.png",
      "brand/icon-512.png",
      "brand/icon-512.webp",
      "brand/apple-touch-icon-180.png"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Ilaw Residences app icon"
  },
  {
    "brand": "ilaw-residences",
    "folder": "brand",
    "name": "brand-board",
    "sourceSize": "vector",
    "files": [
      "brand/brand-board-1600.webp"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Ilaw Residences brand board: logo, colours and fonts"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "brand",
    "name": "logo-symbol",
    "sourceSize": "vector",
    "files": [
      "brand/logo-symbol.svg",
      "brand/logo-symbol-1024.webp",
      "brand/logo-symbol-256.webp",
      "brand/logo-symbol-128.webp"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Tita Lorna's Dorm logo symbol"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "brand",
    "name": "logo-lockup",
    "sourceSize": "vector",
    "files": [
      "brand/logo-lockup.svg",
      "brand/logo-lockup-2000.webp",
      "brand/logo-lockup-800.webp",
      "brand/logo-lockup-400.webp"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Tita Lorna's Dorm logo"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "brand",
    "name": "app-icon",
    "sourceSize": "vector",
    "files": [
      "brand/app-icon.svg",
      "brand/icon-192.png",
      "brand/icon-512.png",
      "brand/icon-512.webp",
      "brand/apple-touch-icon-180.png"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Tita Lorna's Dorm app icon"
  },
  {
    "brand": "tita-lorna-dorm",
    "folder": "brand",
    "name": "brand-board",
    "sourceSize": "vector",
    "files": [
      "brand/brand-board-1600.webp"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Tita Lorna's Dorm brand board: logo, colours and fonts"
  },
  {
    "brand": "sagwan-trips",
    "folder": "brand",
    "name": "logo-symbol",
    "sourceSize": "vector",
    "files": [
      "brand/logo-symbol.svg",
      "brand/logo-symbol-1024.webp",
      "brand/logo-symbol-256.webp",
      "brand/logo-symbol-128.webp"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Sagwan Island Trips logo symbol"
  },
  {
    "brand": "sagwan-trips",
    "folder": "brand",
    "name": "logo-lockup",
    "sourceSize": "vector",
    "files": [
      "brand/logo-lockup.svg",
      "brand/logo-lockup-2000.webp",
      "brand/logo-lockup-800.webp",
      "brand/logo-lockup-400.webp"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Sagwan Island Trips logo"
  },
  {
    "brand": "sagwan-trips",
    "folder": "brand",
    "name": "app-icon",
    "sourceSize": "vector",
    "files": [
      "brand/app-icon.svg",
      "brand/icon-192.png",
      "brand/icon-512.png",
      "brand/icon-512.webp",
      "brand/apple-touch-icon-180.png"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Sagwan Island Trips app icon"
  },
  {
    "brand": "sagwan-trips",
    "folder": "brand",
    "name": "brand-board",
    "sourceSize": "vector",
    "files": [
      "brand/brand-board-1600.webp"
    ],
    "pickedFrom": "built in vector",
    "heroDescription": "",
    "altText": "Sagwan Island Trips brand board: logo, colours and fonts"
  }
] as const;

export function buildPlatformAmenities(createdAt: string): AmenitiesRow[] {
  const entries: readonly {
    readonly id: string;
    readonly code: string;
    readonly label: string;
    readonly icon: string;
    readonly grp: AmenitiesRow["grp"];
  }[] = [
    { id: DEMO_IDS.amenities.wifi, code: "wifi", label: "Fast fiber Wi-Fi", icon: "wifi", grp: "essentials" },
    { id: DEMO_IDS.amenities.aircon, code: "aircon", label: "Air conditioning", icon: "snowflake", grp: "essentials" },
    { id: DEMO_IDS.amenities.waterHeater, code: "water_heater", label: "Hot shower", icon: "flame", grp: "bathroom" },
    { id: DEMO_IDS.amenities.towels, code: "towels", label: "Fresh towels & toiletries", icon: "sparkles", grp: "bathroom" },
    { id: DEMO_IDS.amenities.projector, code: "projector", label: "Movie projector & screen", icon: "projector", grp: "comfort" },
    { id: DEMO_IDS.amenities.boardGames, code: "board_games", label: "Board games & books", icon: "dice-5", grp: "comfort" },
    { id: DEMO_IDS.amenities.coffeeBar, code: "coffee_bar", label: "Coffee bar & snack basket", icon: "coffee", grp: "kitchen" },
    { id: DEMO_IDS.amenities.workDesk, code: "work_desk", label: "Window work desk", icon: "laptop", grp: "comfort" },
    { id: DEMO_IDS.amenities.smartTv, code: "smart_tv", label: "Smart TV & game console", icon: "tv", grp: "comfort" },
    { id: DEMO_IDS.amenities.karaoke, code: "karaoke", label: "Videoke / karaoke system", icon: "mic-vocal", grp: "comfort" },
    { id: DEMO_IDS.amenities.kitchenette, code: "kitchenette", label: "Kitchenette with induction stove", icon: "utensils", grp: "kitchen" },
    { id: DEMO_IDS.amenities.fullKitchen, code: "full_kitchen", label: "Full kitchen & island", icon: "chef-hat", grp: "kitchen" },
    { id: DEMO_IDS.amenities.riceCooker, code: "rice_cooker", label: "Rice cooker & cookware", icon: "cooking-pot", grp: "kitchen" },
    { id: DEMO_IDS.amenities.refrigerator, code: "refrigerator", label: "Refrigerator", icon: "refrigerator", grp: "kitchen" },
    { id: DEMO_IDS.amenities.balcony, code: "balcony", label: "Lake or city view balcony", icon: "sun", grp: "outdoor" },
    { id: DEMO_IDS.amenities.sharedPool, code: "shared_pool", label: "Outdoor swimming pool", icon: "waves", grp: "outdoor" },
    { id: DEMO_IDS.amenities.hotSpringPool, code: "hot_spring_pool", label: "Private natural hot-spring pool", icon: "waves", grp: "outdoor" },
    { id: DEMO_IDS.amenities.kiddiePoolSlide, code: "kiddie_pool_slide", label: "Kiddie pool with slide", icon: "smile", grp: "outdoor" },
    { id: DEMO_IDS.amenities.billiards, code: "billiards", label: "Billiards table", icon: "circle-dot", grp: "outdoor" },
    { id: DEMO_IDS.amenities.pingPong, code: "ping_pong", label: "Ping pong table", icon: "trophy", grp: "outdoor" },
    { id: DEMO_IDS.amenities.halfCourt, code: "half_court", label: "Half basketball court", icon: "dribbble", grp: "outdoor" },
    { id: DEMO_IDS.amenities.charcoalGrill, code: "charcoal_grill", label: "Charcoal ihawan grill", icon: "flame-kindling", grp: "outdoor" },
    { id: DEMO_IDS.amenities.parking, code: "parking", label: "On-site parking", icon: "car", grp: "essentials" },
    { id: DEMO_IDS.amenities.petFriendly, code: "pet_friendly", label: "Pet-friendly", icon: "paw-print", grp: "other" },
    { id: DEMO_IDS.amenities.rooftopDeck, code: "rooftop_deck", label: "Rooftop deck", icon: "building-2", grp: "outdoor" },
    { id: DEMO_IDS.amenities.keycardCctv, code: "keycard_cctv", label: "Keycard / biometric gate & 24/7 CCTV", icon: "shield-check", grp: "safety" },
    { id: DEMO_IDS.amenities.bikeRack, code: "bike_rack", label: "Bicycle rack", icon: "bike", grp: "outdoor" },
    { id: DEMO_IDS.amenities.studyHall, code: "study_hall", label: "24/7 air-conditioned study hall", icon: "book-open", grp: "comfort" },
    { id: DEMO_IDS.amenities.lockers, code: "lockers", label: "Numbered personal lockers", icon: "lock", grp: "safety" },
    { id: DEMO_IDS.amenities.rooftopLaundry, code: "rooftop_laundry", label: "Rooftop laundry & drying area", icon: "shirt", grp: "essentials" },
  ];

  return entries.map((entry, index) => ({
    id: entry.id,
    account_id: null,
    code: entry.code,
    label: entry.label,
    icon: entry.icon,
    grp: entry.grp,
    sort_order: index,
    is_active: true,
    created_at: createdAt,
    updated_at: createdAt,
  }));
}
