import { describe, expect, it } from 'vitest';

import { DEMO_IDS } from '../demo/ids.js';
import type { PropertyPageDraft } from '../schemas/tables/common.js';
import {
  EDITOR_PARTS,
  colourFamily,
  getPageChangesList,
  partIsOn,
  sameDraft,
  withPartSection,
} from './changes.js';

function makeBaseDraft(): PropertyPageDraft {
  return {
    logo: DEMO_IDS.ulapSuites.logoFile,
    tagline: 'Your weekend above the clouds',
    about: 'Cozy Tagaytay Ridge staycations with Taal Lake sunrise balconies.',
    look: {
      brandColor: '#6167C6',
      pageColor: '#F9FAFF',
      cardColor: '#E8ECFF',
      accentColor: '#E68B3C',
      logoShape: 'rounded',
      fontPair: 'cafe',
      banners: [
        {
          photo: 'dec0de10-0006-4000-8000-000000000001',
          alt: 'Couple on balcony at sunrise',
          title: 'Sunrise over Taal',
          line: 'Coffee in hand',
          link: null,
        },
        {
          photo: 'dec0de10-0006-4000-8000-000000000002',
          alt: 'Projector movie corner',
          title: 'Movie nights',
          line: 'Under fairy lights',
          link: null,
        },
      ],
      bannerSeconds: 5,
      announcement: {
        text: 'Sunrise slots fill fast on weekends.',
        tone: 'info',
        endDate: '2027-01-10',
      },
      sections: {
        banners: true,
        announcement: true,
        about: true,
        units: true,
        highlights: true,
        rules: true,
        location: true,
        times: true,
        faq: true,
      },
    },
    install: {
      homeScreenName: 'Ulap Suites',
      splashColor: '#3A3C83',
      splashAnimation: true,
      showName: true,
      showTagline: true,
    },
    hero: {
      cover: 'dec0de10-0006-4000-8000-000000000004',
      photos: ['dec0de10-0006-4000-8000-000000000004', 'dec0de10-0006-4000-8000-000000000005'],
    },
    host: {
      displayName: 'Marco Villanueva',
      photoFile: null,
      languages: ['Tagalog', 'English'],
    },
    units: [DEMO_IDS.ulapSuites.units.studioFog, DEMO_IDS.ulapSuites.units.taalView1br],
    highlights: [DEMO_IDS.amenities.wifi, DEMO_IDS.amenities.projector],
    faq: [
      {
        question: 'Does the condo require guest IDs?',
        answer: 'Yes, at least 48 hours before check-in.',
      },
    ],
    seo: {
      title: 'Ulap Suites Tagaytay',
      description: 'Taal View Staycation',
      sharePictureFile: 'dec0de10-0006-4000-8000-000000000004',
      hideFromSearch: false,
    },
  };
}

describe('getPageChangesList (editor diff)', () => {
  it('1. returns an empty list when draft and published are identical (regardless of key order)', () => {
    const base = makeBaseDraft();
    const reordered: PropertyPageDraft = {
      seo: base.seo,
      faq: base.faq,
      highlights: base.highlights,
      units: base.units,
      host: base.host,
      hero: base.hero,
      install: base.install,
      look: base.look,
      about: base.about,
      tagline: base.tagline,
      logo: base.logo,
    };
    expect(sameDraft(base, reordered)).toBe(true);
    expect(getPageChangesList(base, reordered)).toEqual([]);
  });

  it('2. reports style changes: logo, brand/page/card/accent colours, logo shape, and tagline', () => {
    const published = makeBaseDraft();
    const draft = structuredClone(published);
    draft.logo = null;
    draft.look.brandColor = '#1F9D55';
    draft.look.pageColor = '#FFFFFF';
    draft.look.cardColor = '#F1F5F9';
    draft.look.accentColor = '#D7372F';
    draft.look.logoShape = 'circle';
    draft.tagline = 'New ridge tagline';

    const changes = getPageChangesList(published, draft);
    expect(changes).toEqual([
      { part: 'style', words: 'Logo removed' },
      { part: 'style', words: 'Brand colour: Green #1F9D55' },
      { part: 'style', words: 'Page colour: #FFFFFF' },
      { part: 'style', words: 'Card colour: #F1F5F9' },
      { part: 'style', words: 'Accent colour: Red #D7372F' },
      { part: 'style', words: 'Logo shape: circle' },
      { part: 'style', words: 'Tagline changed' },
    ]);
  });

  it('3. reports font pair changes with display name ("Fonts: Café", "Fonts: Modern")', () => {
    const published = makeBaseDraft();
    published.look.fontPair = 'modern';
    const draft = structuredClone(published);
    draft.look.fontPair = 'cafe';

    expect(getPageChangesList(published, draft)).toEqual([{ part: 'fonts', words: 'Fonts: Café' }]);
  });

  it('4. reports install look changes (home screen name, splash colour, and animation/switches)', () => {
    const published = makeBaseDraft();
    const draftName = structuredClone(published);
    draftName.install.homeScreenName = 'Ulap Ridge';
    expect(getPageChangesList(published, draftName)).toEqual([
      { part: 'install', words: 'Home screen name: Ulap Ridge' },
    ]);

    const draftSplash = structuredClone(published);
    draftSplash.install.splashColor = '#112233';
    expect(getPageChangesList(published, draftSplash)).toEqual([
      { part: 'install', words: 'Splash colour: #112233' },
    ]);

    const draftAnim = structuredClone(published);
    draftAnim.install.splashAnimation = false;
    expect(getPageChangesList(published, draftAnim)).toEqual([
      { part: 'install', words: 'Install look changed' },
    ]);
  });

  it('5. reports hero cover photo and gallery order changes', () => {
    const published = makeBaseDraft();
    const draftCover = structuredClone(published);
    draftCover.hero.cover = 'dec0de10-0006-4000-8000-000000000005';
    expect(getPageChangesList(published, draftCover)).toEqual([
      { part: 'hero', words: 'Cover photo changed' },
    ]);

    const draftOrder = structuredClone(published);
    draftOrder.hero.photos = [...published.hero.photos].reverse();
    expect(getPageChangesList(published, draftOrder)).toEqual([
      { part: 'hero', words: 'Hero photos changed' },
    ]);
  });

  it('6. reports promo banner photo, text, count, and slide timing changes ("Banner 2 photo")', () => {
    const published = makeBaseDraft();
    const draftPhoto = structuredClone(published);
    const secondBanner = draftPhoto.look.banners[1];
    if (secondBanner) {
      secondBanner.photo = 'dec0de10-0006-4000-8000-000000000003';
    }
    draftPhoto.look.bannerSeconds = 7;

    expect(getPageChangesList(published, draftPhoto)).toEqual([
      { part: 'banners', words: 'Banner 2 photo' },
      { part: 'banners', words: 'Each banner shows 7 seconds' },
    ]);

    const draftCount = structuredClone(published);
    draftCount.look.banners = published.look.banners.slice(0, 1);
    draftCount.look.bannerSeconds = 9; // ignored when <= 1 banner
    expect(getPageChangesList(published, draftCount)).toEqual([
      { part: 'banners', words: 'Banners: 2 → 1' },
    ]);
  });

  it('7. reports announcement added, changed, and removed', () => {
    const published = makeBaseDraft();
    const draftChanged = structuredClone(published);
    if (draftChanged.look.announcement) {
      draftChanged.look.announcement.text = 'Weekday 15% promo this month!';
    }
    expect(getPageChangesList(published, draftChanged)).toEqual([
      { part: 'announcement', words: 'Announcement changed' },
    ]);

    const draftRemoved = structuredClone(published);
    draftRemoved.look.announcement = null;
    expect(getPageChangesList(published, draftRemoved)).toEqual([
      { part: 'announcement', words: 'Announcement removed' },
    ]);

    expect(getPageChangesList(draftRemoved, published)).toEqual([
      { part: 'announcement', words: 'Announcement added' },
    ]);
  });

  it('8. reports about text and host profile changes (name, photo, languages)', () => {
    const published = makeBaseDraft();
    const draft = structuredClone(published);
    draft.about = 'Updated story about our Tagaytay ridge suites.';
    draft.host.displayName = 'Marco & Bea';

    expect(getPageChangesList(published, draft)).toEqual([
      { part: 'about', words: 'About changed' },
      { part: 'about', words: 'Host name: Marco & Bea' },
    ]);
  });

  it('9. reports featured units, highlights, and FAQ changes', () => {
    const published = makeBaseDraft();
    const draft = structuredClone(published);
    draft.units = [DEMO_IDS.ulapSuites.units.taalView1br];
    draft.highlights = [
      DEMO_IDS.amenities.wifi,
      DEMO_IDS.amenities.projector,
      DEMO_IDS.amenities.coffeeBar,
    ];
    draft.faq = [
      ...published.faq,
      { question: 'Is check-in flexible?', answer: 'Standard check-in starts at 2:00 PM.' },
    ];

    expect(getPageChangesList(published, draft)).toEqual([
      { part: 'units', words: 'Featured units: 2 → 1' },
      { part: 'highlights', words: 'Highlights: 2 → 3' },
      { part: 'faq', words: 'FAQ: 1 → 2' },
    ]);
  });

  it('10. reports share & search (SEO) and section visibility switch changes across owned parts', () => {
    const published = makeBaseDraft();
    let draft = structuredClone(published);
    draft.seo.title = 'New Share Title';
    draft.seo.hideFromSearch = true;
    draft = withPartSection(draft, 'rules', false);
    draft = withPartSection(draft, 'location', false);
    draft = withPartSection(draft, 'times', false);

    expect(partIsOn(draft, 'rules')).toBe(false);
    expect(partIsOn(draft, 'style')).toBeNull();
    expect(EDITOR_PARTS).toHaveLength(14);

    expect(getPageChangesList(published, draft)).toEqual([
      { part: 'seo', words: 'Share title changed' },
      { part: 'seo', words: 'Search indexing: hidden' },
      { part: 'rules', words: 'Rules and policies: hidden' },
      { part: 'location', words: 'Location and contact: hidden' },
      { part: 'times', words: 'Times: hidden' },
    ]);
  });

  it('11. maps brand hex values to plain colour families', () => {
    expect(colourFamily('#D7372F')).toBe('red');
    expect(colourFamily('#0E7AC4')).toBe('blue');
    expect(colourFamily('#6F4E37')).toBe('brown');
    expect(colourFamily('#1F9D55')).toBe('green');
    expect(colourFamily('#FFFFFF')).toBe('white');
    expect(colourFamily('#111111')).toBe('black');
  });
});
