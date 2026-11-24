import { CustomWniosekEntry, ReportDocument } from '../types/reports';

export type WniosekGroupName =
  | 'Własne wnioski'
  | 'Edukacja wczesnoszkolna (klasy 1–3)'
  | 'Przedmioty humanistyczne i języki'
  | 'Przedmioty ścisłe i przyrodnicze'
  | 'Przedmioty artystyczne, techniczne i inne'
  | 'Specjaliści i komórki szkolne';

export interface WniosekCategory {
  id: string;
  label: string;
  group: WniosekGroupName;
  items: string[];
}

export interface WniosekDisplayItem {
  id?: string;
  text: string;
  isCustom: boolean;
}

export interface MergedWniosekCategory {
  id: string;
  label: string;
  group: WniosekGroupName;
  items: WniosekDisplayItem[];
}

export const CUSTOM_WNIOSKI_CATEGORY_ID = 'wlasne_ogolne';

export const WNIOSKI_DATABASE: WniosekCategory[] = [
  {
    id: 'wczesnoszkolna_1_3',
    label: 'Edukacja wczesnoszkolna (klasy 1–3 ogólnie)',
    group: 'Edukacja wczesnoszkolna (klasy 1–3)',
    items: [
      'Systematyczne doskonalenie techniki czytania ze zrozumieniem poprzez codzienne głośne i ciche czytanie krótkich tekstów oraz zadawanie pytań sprawdzających.',
      'Utrwalanie poprawności ortograficznej i kaligraficznej (dbanie o estetykę pisma, prawidłowe łączenie liter oraz zapis w liniaturze).',
      'Wzmacnianie sprawności rachunkowej w pamięci (dodawanie i odejmowanie z przekroczeniem progu dziesiątkowego) oraz umiejętności rozwiązywania prostych zadań tekstowych.',
      'Rozwijanie samodzielności uczniów podczas wykonywania zadań oraz wdrażanie do samokontroli i sprawdzania swojej pracy przed oddaniem.',
      'Kształtowanie umiejętności współpracy w grupie, kulturalnej komunikacji oraz rozwiązywania konfliktów rówieśniczych bez użycia agresji.',
      'Prowadzenie regularnych ćwiczeń wspomagających motorykę małą i koordynację wzrokowo-ruchową u uczniów wymagających wsparcia.',
    ],
  },
  {
    id: 'wczesnoszkolna_2_3',
    label: 'Edukacja wczesnoszkolna (klasy 2 i 3)',
    group: 'Edukacja wczesnoszkolna (klasy 1–3)',
    items: [
      'Utrwalanie tabliczki mnożenia i dzielenia w pamięci poprzez gry dydaktyczne, zabawy interaktywne i krótkie rozgrzewki matematyczne na początku zajęć.',
      'Doskonalenie umiejętności redagowania dłuższych, spójnych wypowiedzi pisemnych (opis, list, krótkie opowiadanie) z zachowaniem zasad ortografii i interpunkcji.',
      'Przygotowanie uczniów klasy 3 do płynnego przejścia do II etapu edukacyjnego (systematyczna praca z tekstem, samodzielne wyszukiwanie informacji, planowanie pracy).',
      'Wdrażanie zadań tekstowych wieloetapowych z analizą danych, rysunkiem pomocniczym i formułowaniem pełnej odpowiedzi.',
      'Wspieranie uczniów uzdolnionych poprzez powierzanie im dodatkowych zadań problemowych oraz udział w konkursach szkolnych i międzyszkolnych.',
    ],
  },
  {
    id: 'angielski_1_3',
    label: 'Język angielski (klasy 1–3)',
    group: 'Edukacja wczesnoszkolna (klasy 1–3)',
    items: [
      'Częstsze wprowadzanie krótkich piosenek, rymowanek i zabaw ruchowych TPR utrwalających słownictwo oraz proste struktury komunikacyjne.',
      'Stopniowe oswajanie uczniów z zapisem graficznym poznanych słów (łączenie wyrazu mówionego z pisanym na poziomie klasy 2 i 3).',
      'Zachęcanie do reagowania prostymi zdaniami i zwrotami grzecznościowymi w sytuacjach codziennych podczas lekcji.',
      'Systematyczne powtarzanie podstawowych bloków leksykalnych (kolory, liczby, zwierzęta, rodzina, czynności) w formie gier planszowych i obrazkowych.',
    ],
  },
  {
    id: 'niemiecki_mniejszosci_1_3',
    label: 'Język niemiecki / język mniejszości (klasy 1–3)',
    group: 'Edukacja wczesnoszkolna (klasy 1–3)',
    items: [
      'Rozwijanie rozumienia ze słuchu i poprawnej wymowy poprzez stałe stosowanie krótkich poleceń lekcyjnych w języku docelowym.',
      'Utrwalanie słownictwa podstawowego metodami polisensorycznymi (karty obrazkowe, gry memory, prace plastyczno-językowe).',
      'Włączanie elementów kultury, tradycji i zwyczajów regionu/obszaru językowego w formie warsztatów i projektów klasowych.',
      'Stopniowe wdrażanie do krótkich dialogów w parach z naciskiem na przełamywanie bariery językowej.',
    ],
  },
  {
    id: 'informatyka_1_3',
    label: 'Informatyka (klasy 1–3)',
    group: 'Edukacja wczesnoszkolna (klasy 1–3)',
    items: [
      'Kształtowanie prawidłowych nawyków ergonomii pracy przy komputerze oraz zasad bezpiecznego i higienicznego korzystania z urządzeń ekranowych.',
      'Rozwijanie myślenia algorytmicznego poprzez zabawy offline (kodowanie na dywanie) oraz proste środowiska wizualne (ScratchJr, Blockly).',
      'Ćwiczenie precyzyjnej obsługi myszy, klawiatury (polskie znaki, wielkie litery) oraz zapisywania prostych prac graficznych we wskazanym folderze.',
      'Rozmowy wychowawcze na temat podstaw bezpieczeństwa w internecie, ochrony danych osobowych oraz kulturalnego zachowania w sieci.',
    ],
  },
  {
    id: 'wf_ogolny',
    label: 'Wychowanie fizyczne (klasy 1–3 oraz 4–8)',
    group: 'Przedmioty artystyczne, techniczne i inne',
    items: [
      'Kształtowanie nawyku codziennej aktywności fizycznej, prawidłowej postawy ciała oraz zasad higieny osobistej po wysiłku fizycznym.',
      'Motywowanie uczniów mniej sprawnych i unikających ćwiczeń poprzez indywidualizację wymagań, gry zespołowe o obniżonej presji wyniku i pochwałę za zaangażowanie.',
      'Doskonalenie sprawności motorycznych (koordynacji, zwinności, wytrzymałości) oraz zasad fair play podczas rywalizacji sportowej.',
      'Włączanie ćwiczeń korekcyjno-kompensacyjnych oraz rozciągających w ramach rozgrzewki i części końcowej lekcji.',
      'Przygotowanie chętnych uczniów do zawodów sportowych rangi gminnej i powiatowej oraz popularyzacja rekreacji na świeżym powietrzu.',
    ],
  },
  {
    id: 'polski_4',
    label: 'Język polski (klasa 4)',
    group: 'Przedmioty humanistyczne i języki',
    items: [
      'Systematyczne ćwiczenie czytania ze zrozumieniem i wyszukiwania informacji bezpośrednio oraz pośrednio wyrażonych w tekście literackim i nieliterackim.',
      'Utrwalanie zasad ortograficznych (rz/ż, ó/u, ch/h, pisownia wielką literą) w formie krótkich dyktand tematycznych i gier ortograficznych.',
      'Kształtowanie umiejętności budowania spójnej wypowiedzi pisemnej (plan wydarzeń, list, opis przedmiotu i postaci, krótkie opowiadanie z dialogiem).',
      'Uporządkowanie wiedzy o częściach mowy (rzeczownik, czasownik, przymiotnik, przysłówek) poprzez praktyczne ćwiczenia redakcyjne.',
      'Motywowanie do czytania lektur obowiązkowych i dodatkowych poprzez projekty kreatywne (lapbooki, lektury w pudełku, inscenizacje).',
    ],
  },
  {
    id: 'polski_5_6',
    label: 'Język polski (klasy 5 i 6)',
    group: 'Przedmioty humanistyczne i języki',
    items: [
      'Doskonalenie redagowania dłuższych form wypowiedzi (opowiadanie twórcze, charakterystyka, sprawozdanie, zaproszenie, ogłoszenie) z dbałością o kompozycję trójdzielną i akapity.',
      'Pogłębianie analizy tekstów kultury oraz rozpoznawania środków stylistycznych i ich funkcji w wierszach oraz prozie.',
      'Systematyczne powtarzanie zagadnień z nauki o języku (odmiana wyrazów, części zdania, związki wyrazowe) przed przejściem do klas starszych.',
      'Eliminowanie najczęstszych błędów językowych, interpunkcyjnych i składniowych poprzez pracę z własnym tekstem i korektę koleżeńską.',
      'Rozwijanie kultury słowa oraz umiejętności argumentowania własnego zdania w dyskusji klasowej.',
    ],
  },
  {
    id: 'polski_7_8',
    label: 'Język polski (klasy 7 i 8)',
    group: 'Przedmioty humanistyczne i języki',
    items: [
      'Intensywne doskonalenie pisania rozprawki oraz przemówienia z wykorzystaniem trafnych argumentów odwołujących się do lektur obowiązkowych.',
      'Systematyczne rozwiązywanie arkuszy i zadań typu egzaminacyjnego ze szczególnym naciskiem na czytanie ze zrozumieniem i pracę z tekstem nieliterackim.',
      'Utrwalanie znajomości treści i problematyki lektur obowiązkowych poprzez mapy myśli, powtórki tematyczne i karty pracy.',
      'Kształcenie umiejętności tworzenia krótkich form użytkowych (zaproszenie, ogłoszenie) zgodnie z kryteriami oceniania OKE.',
      'Indywidualizacja wsparcia dla uczniów mających trudności z konstruowaniem wypowiedzi argumentacyjnej oraz wzbogacanie słownictwa.',
    ],
  },
  {
    id: 'angielski_4_8',
    label: 'Język angielski (klasy 4–8)',
    group: 'Przedmioty humanistyczne i języki',
    items: [
      'Zwiększenie udziału komunikacji ustnej na lekcjach (praca w parach, scenki sytuacyjne, krótkie wypowiedzi na temat codzienny) w celu przełamywania bariery w mówieniu.',
      'Systematyczne utrwalanie struktur gramatycznych (czasy teraźniejsze, przeszłe, przyszłe, strona bierna, tryby warunkowe) w kontekście komunikacyjnym.',
      'Doskonalenie rozumienia ze słuchu oraz czytania ze zrozumieniem poprzez pracę z autentycznymi nagraniami i tekstami o zróżnicowanym stopniu trudności.',
      'Regularne ćwiczenie wypowiedzi pisemnych (e-mail, wpis na blogu, zaproszenie) zgodnie z wymaganiami egzaminu ósmoklasisty.',
      'Wdrażanie uczniów do systematycznego powtarzania słownictwa i korzystania z aplikacji lub fiszek leksykalnych.',
    ],
  },
  {
    id: 'niemiecki_hiszpanski',
    label: 'Język niemiecki i język hiszpański',
    group: 'Przedmioty humanistyczne i języki',
    items: [
      'Utrwalanie podstawowych struktur gramatycznych (odmiana czasowników regularnych i nieregularnych, szyk zdania, rodzajniki i przyimki) w krótkich dialogach.',
      'Kształtowanie płynności komunikacyjnej w typowych sytuacjach życia codziennego (zakupy, szkoła, rodzina, czas wolny, podróż).',
      'Systematyczne poszerzanie zasobu leksykalnego poprzez mapy skojarzeń, gry językowe i powtórki spiralne na początku zajęć.',
      'Doskonalenie rozumienia ze słuchu oraz poprawnej wymowy i intonacji poprzez pracę z nagraniami rodzimych użytkowników języka.',
      'Rozwijanie wiedzy realioznawczej i kulturowej krajów niemieckojęzycznych / hiszpańskojęzycznych w formie mini-projektów.',
    ],
  },
  {
    id: 'historia_wos',
    label: 'Historia i Wiedza o społeczeństwie (WOS)',
    group: 'Przedmioty humanistyczne i języki',
    items: [
      'Doskonalenie umiejętności pracy ze źródłami historycznymi (tekst pisanym, ikonografią, mapą historyczną, linią czasu) oraz analizy związków przyczynowo-skutkowych.',
      'Utrwalanie chronologii najważniejszych wydarzeń historycznych Polski i świata z wykorzystaniem osi czasu i powtórek przekrojowych.',
      'Rozwijanie świadomości obywatelskiej, znajomości praw i obowiązków ucznia oraz mechanizmów funkcjonowania samorządu lokalnego i państwa.',
      'Kształtowanie umiejętności krytycznej oceny informacji medialnych oraz prowadzenia kulturalnej debaty opartej na faktach.',
      'Wspieranie uczniów zainteresowanych historią i WOS-em w przygotowaniach do konkursów kuratoryjnych i projektów patriotyczno-obywatelskich.',
    ],
  },
  {
    id: 'matematyka',
    label: 'Matematyka',
    group: 'Przedmioty ścisłe i przyrodnicze',
    items: [
      'Systematyczne utrwalanie biegłości rachunkowej (ułamki zwykłe i dziesiętne, liczby ujemne, procenty, potęgi i pierwiastki) na początku każdej lekcji.',
      'Doskonalenie czytania ze zrozumieniem zadań tekstowych i przekładania treści zadania na wyrażenia algebraiczne, równania lub schematy graficzne.',
      'Zwiększenie nacisku na zadania geometryczne wymagające wyobraźni przestrzennej, uzasadniania i dowodzenia własności figur.',
      'Prowadzenie regularnych powtórek spiralnych oraz rozwiązywanie zadań otwartych krok po kroku z analizą typowych błędów.',
      'Objęcie pomocą dydaktyczną uczniów mających braki z wcześniejszych etapów (konsultacje, zajęcia wyrównawcze) oraz rozwijanie talentów matematycznych.',
    ],
  },
  {
    id: 'biologia_przyroda',
    label: 'Biologia i Przyroda',
    group: 'Przedmioty ścisłe i przyrodnicze',
    items: [
      'Zwiększenie liczby obserwacji przyrodniczych, doświadczeń i prac z mikroskopem rozwijających umiejętność formułowania problemu badawczego i hipotezy.',
      'Doskonalenie czytania schematów biologicznych, wykresów oraz tabel przedstawiających zależności w przyrodzie i funkcjonowanie organizmu człowieka.',
      'Utrwalanie poprawnego posługiwania się terminologią biologiczną w krótkich wypowiedziach ustnych i pisemnych.',
      'Kształtowanie postaw proekologicznych i prozdrowotnych poprzez projekty terenowe, analizę lokalnych ekosystemów i profilaktykę zdrowotną.',
    ],
  },
  {
    id: 'geografia',
    label: 'Geografia',
    group: 'Przedmioty ścisłe i przyrodnicze',
    items: [
      'Systematyczne doskonalenie umiejętności czytania i interpretacji map ogólnogeograficznych, tematycznych oraz klimatogramów.',
      'Ćwiczenie obliczeń geograficznych (skala mapy, wysokość Słońca, różnice czasu słonecznego, gęstość zaludnienia, przyrost naturalny).',
      'Łączenie wiedzy teoretycznej z aktualnymi zjawiskami przyrodniczymi, gospodarczymi i demograficznymi w Polsce oraz na świecie.',
      'Wykorzystywanie narzędzi cyfrowych (mapy satelitarne, atlasy interaktywne) oraz zajęć terenowych do obserwacji najbliższej okolicy.',
    ],
  },
  {
    id: 'fizyka_chemia',
    label: 'Fizyka i Chemia',
    group: 'Przedmioty ścisłe i przyrodnicze',
    items: [
      'Zwiększenie nacisku na bezpieczne wykonywanie doświadczeń pokazowych i uczniowskich oraz formułowanie obserwacji i wniosków.',
      'Doskonalenie przekształcania wzorów, przeliczania jednostek układu SI oraz opisywania zjawisk za pomocą wykresów i równań reakcji chemicznych.',
      'Systematyczne ćwiczenie zapisu i uzgadniania równań reakcji chemicznych oraz obliczeń stechiometrycznych i stężeń procentowych.',
      'Wyjaśnianie praw fizycznych i procesów chemicznych w odniesieniu do zjawisk życia codziennego w celu zwiększenia motywacji uczniów.',
    ],
  },
  {
    id: 'informatyka_4_8',
    label: 'Informatyka (klasy 4–8, bezpieczeństwo, AI, sprzęt)',
    group: 'Przedmioty ścisłe i przyrodnicze',
    items: [
      'Pogłębianie edukacji w zakresie cyberbezpieczeństwa: silne hasła, weryfikacja dwuetapowa, ochrona wizerunku, rozpoznawanie phishingu i dezinformacji.',
      'Kształtowanie świadomego i krytycznego podejścia do narzędzi sztucznej inteligencji (AI): weryfikacja faktów, poszanowanie praw autorskich, etyka korzystania z AI w nauce.',
      'Rozwijanie umiejętności programowania strukturalnego i algorytmicznego (Scratch, Python) oraz analizy danych w arkuszach kalkulacyjnych.',
      'Praktyczne ćwiczenie tworzenia dokumentów tekstowych, prezentacji i grafiki zgodnie z zasadami netykiety i praw autorskich.',
      'Doposażenie i bieżąca konserwacja pracowni komputerowej oraz wykorzystanie robotów edukacyjnych, mikrokontrolerów lub sprzętu Laboratoriów Przyszłości.',
    ],
  },
  {
    id: 'technika_muzyka_plastyka',
    label: 'Technika, Muzyka i Plastyka',
    group: 'Przedmioty artystyczne, techniczne i inne',
    items: [
      'Technika: Doskonalenie dokładności w wykonywaniu rysunku technicznego, bezpiecznego posługiwania się narzędziami oraz utrwalanie przepisów ruchu drogowego (karta rowerowa).',
      'Plastyka: Rozwijanie wrażliwości estetycznej, kreatywności oraz znajomości różnorodnych technik plastycznych i podstawowych kierunków w sztuce.',
      'Muzyka: Angażowanie uczniów w aktywne muzykowanie (śpiew, gra na instrumentach szkolnych), rozwijanie poczucia rytmu oraz wiedzy o kulturze muzycznej.',
      'Organizowanie szkolnych wystaw prac uczniowskich, koncertów oraz konkursów artystycznych wzmacniających wiarę uczniów we własne możliwości.',
    ],
  },
  {
    id: 'doradztwo_religia',
    label: 'Doradztwo zawodowe i Religia / Etyka',
    group: 'Przedmioty artystyczne, techniczne i inne',
    items: [
      'Doradztwo zawodowe: Wspieranie uczniów klas 7–8 w rozpoznawaniu własnych predyspozycji, mocnych stron i zainteresowań oraz planowaniu ścieżki dalszego kształcenia.',
      'Doradztwo zawodowe: Zapoznanie uczniów i rodziców z aktualną ofertą szkół ponadpodstawowych, zasadami rekrutacji oraz wymaganiami współczesnego rynku pracy.',
      'Religia / Etyka: Kształtowanie postaw szacunku, empatii, odpowiedzialności moralnej oraz wrażliwości na potrzeby drugiego człowieka (wolontariat szkolny).',
      'Religia / Etyka: Prowadzenie dialogu i refleksji nad wartościami uniwersalnymi w oparciu o aktywizujące metody pracy oraz działania wychowawcze szkoły.',
    ],
  },
  {
    id: 'biblioteka',
    label: 'Biblioteka szkolna',
    group: 'Specjaliści i komórki szkolne',
    items: [
      'Kontynuowanie akcji promujących czytelnictwo (konkursy czytelnicze, pasowanie na czytelnika, wyzwania czytelnicze, głośne czytanie w klasach 1–3).',
      'Systematyczne uzupełnianie księgozbioru o nowości wydawnicze oraz brakujące egzemplarze lektur zgodnie z zapotrzebowaniem uczniów i nauczycieli.',
      'Współpraca z wychowawcami i polonistami w zakresie monitorowania aktywności czytelniczej klas oraz wspierania uczniów słabiej czytających.',
      'Rozwijanie kompetencji informacyjnych uczniów podczas lekcji bibliotecznych (korzystanie z katalogu, weryfikacja źródeł, poszanowanie książki).',
      'Utrzymywanie przyjaznej, otwartej przestrzeni biblioteki jako miejsca wyciszenia, nauki własnej oraz spotkań kulturalnych.',
    ],
  },
  {
    id: 'pedagog_psycholog',
    label: 'Pedagog i Psycholog szkolny',
    group: 'Specjaliści i komórki szkolne',
    items: [
      'Kontynuowanie zajęć z zakresu profilaktyki zdrowia psychicznego, radzenia sobie ze stresem, emocjami oraz budowania pozytywnych relacji rówieśniczych.',
      'Wczesne rozpoznawanie trudności dydaktycznych, emocjonalnych i wychowawczych uczniów oraz szybkie obejmowanie ich adekwatnymi formami pomocy psychologiczno-pedagogicznej.',
      'Wzmacnianie współpracy z rodzicami/opiekunami poprzez indywidualne konsultacje, warsztaty wychowawcze i przekazywanie wskazówek do pracy w domu.',
      'Ścisła współpraca z wychowawcami, nauczycielami oraz poradnią psychologiczno-pedagogiczną w zakresie realizacji zaleceń z opinii i orzeczeń.',
      'Realizacja programów profilaktycznych dotyczących przeciwdziałania przemocy rówieśniczej, cyberprzemocy oraz uzależnieniom behawioralnym i od substancji.',
    ],
  },
  {
    id: 'logopeda',
    label: 'Logopeda szkolny',
    group: 'Specjaliści i komórki szkolne',
    items: [
      'Przeprowadzenie na początku roku szkolnego przesiewowych badań logopedycznych wśród uczniów oddziałów przedszkolnych i klas pierwszych.',
      'Systematyczne prowadzenie terapii wad wymowy i zaburzeń komunikacji językowej w małych grupach oraz indywidualnie zgodnie z potrzebami uczniów.',
      'Zwiększenie zaangażowania rodziców w utrwalanie wywołanych głosek poprzez regularne przekazywanie zestawów ćwiczeń do pracy w domu.',
      'Współpraca z nauczycielami edukacji wczesnoszkolnej w zakresie profilaktyki logopedycznej, ćwiczeń oddechowych, fonacyjnych i słuchu fonemowego.',
    ],
  },
  {
    id: 'swietlica',
    label: 'Świetlica szkolna',
    group: 'Specjaliści i komórki szkolne',
    items: [
      'Zapewnienie bezpiecznej, wszechstronnej opieki wychowawczej przed lekcjami i po nich z podziałem na strefy aktywności (odpoczynek, zabawa, odrabianie lekcji).',
      'Rozwijanie zainteresowań plastycznych, technicznych, czytelniczych i ruchowych wychowanków poprzez cykliczne zajęcia tematyczne i dni okolicznościowe.',
      'Kształtowanie nawyków kulturalnego zachowania przy stole, dbania o porządek we wspólnej przestrzeni oraz zgodnej zabawy w grupie.',
      'Usprawnienie organizacji czasu przeznaczonego na pomoc w odrabianiu zadań domowych oraz gry integracyjne uczące współpracy.',
    ],
  },
  {
    id: 'wspolorganizujacy',
    label: 'Nauczyciel współorganizujący kształcenie',
    group: 'Specjaliści i komórki szkolne',
    items: [
      'Dalsze dostosowywanie kart pracy, sprawdzianów i wymagań edukacyjnych do indywidualnych możliwości psychofizycznych ucznia wynikających z IPET i WOPFU.',
      'Wzmacnianie samodzielności ucznia na lekcjach poprzez stopniowe wycofywanie bezpośredniej podpowiedzi na rzecz komunikatów wspierających i planów aktywności.',
      'Ścisła współpraca z zespołem nauczycieli uczących, specjalistami oraz rodzicami w celu ujednolicenia oddziaływań wychowawczych i dydaktycznych.',
      'Wspieranie integracji społecznej ucznia z zespołem klasowym, kształtowanie umiejętności komunikacyjnych i regulacji emocji w sytuacjach trudnych.',
    ],
  },
];

export function suggestCategoryIdForDocument(doc: ReportDocument): string | null {
  if (doc.type === 'podsumowanie_specjalisty') {
    switch (doc.role) {
      case 'biblioteka':
        return 'biblioteka';
      case 'pedagog_psycholog':
        return 'pedagog_psycholog';
      case 'logopeda':
        return 'logopeda';
      case 'swietlica':
        return 'swietlica';
      case 'wspolorganizujacy_ksztalcenie':
      case 'wspolorganizujacy_indywidualne':
        return 'wspolorganizujacy';
    }
  }

  if (doc.type === 'zbiorcze_efekty' && doc.mode === 'wczesnoszkolna') {
    return 'wczesnoszkolna_1_3';
  }

  const raw =
    doc.type === 'efekty_nauczania'
      ? `${doc.subject} ${doc.className}`.toLowerCase()
      : doc.type === 'zbiorcze_efekty'
        ? doc.subjectOrStage.toLowerCase()
        : '';

  if (!raw) return null;

  const isEarly = /\b(1|2|3|i|ii|iii)[a-z]?\b/.test(raw) || raw.includes('wczesnoszkol');
  if (raw.includes('wczesnoszkol') || raw.includes('zintegrow')) {
    return raw.includes('2') || raw.includes('3') ? 'wczesnoszkolna_2_3' : 'wczesnoszkolna_1_3';
  }
  if (raw.includes('angiel')) return isEarly ? 'angielski_1_3' : 'angielski_4_8';
  if (raw.includes('niemiec') || raw.includes('mniejszo')) {
    return isEarly ? 'niemiecki_mniejszosci_1_3' : 'niemiecki_hiszpanski';
  }
  if (raw.includes('hiszpa')) return 'niemiecki_hiszpanski';
  if (raw.includes('inform')) return isEarly ? 'informatyka_1_3' : 'informatyka_4_8';
  if (raw.includes('wf') || raw.includes('fizyczn')) return 'wf_ogolny';
  if (raw.includes('polsk')) {
    if (raw.includes('4')) return 'polski_4';
    if (raw.includes('5') || raw.includes('6')) return 'polski_5_6';
    return 'polski_7_8';
  }
  if (raw.includes('histor') || raw.includes('wos')) return 'historia_wos';
  if (raw.includes('matem')) return 'matematyka';
  if (raw.includes('biolog') || raw.includes('przyrod')) return 'biologia_przyroda';
  if (raw.includes('geograf')) return 'geografia';
  if (raw.includes('fizyk') || raw.includes('chem')) return 'fizyka_chemia';
  if (raw.includes('techn') || raw.includes('muzy') || raw.includes('plasty'))
    return 'technika_muzyka_plastyka';
  if (raw.includes('doradz') || raw.includes('relig') || raw.includes('etyk'))
    return 'doradztwo_religia';

  return null;
}

export const WNIOSKI_CATEGORY_OPTIONS: { id: string; label: string; group: WniosekGroupName }[] = [
  {
    id: CUSTOM_WNIOSKI_CATEGORY_ID,
    label: 'Własne wnioski (ogólne)',
    group: 'Własne wnioski',
  },
  ...WNIOSKI_DATABASE.map((c) => ({
    id: c.id,
    label: c.label,
    group: c.group,
  })),
];

export function buildMergedWnioskiCategories(
  customWnioski: CustomWniosekEntry[]
): MergedWniosekCategory[] {
  const byCat = new Map<string, CustomWniosekEntry[]>();
  for (const entry of customWnioski) {
    const list = byCat.get(entry.categoryId) ?? [];
    list.push(entry);
    byCat.set(entry.categoryId, list);
  }

  const result: MergedWniosekCategory[] = [];

  const generalCustom = byCat.get(CUSTOM_WNIOSKI_CATEGORY_ID) ?? [];
  if (generalCustom.length > 0) {
    result.push({
      id: CUSTOM_WNIOSKI_CATEGORY_ID,
      label: 'Własne wnioski (ogólne)',
      group: 'Własne wnioski',
      items: generalCustom.map((e) => ({
        id: e.id,
        text: e.text,
        isCustom: true,
      })),
    });
  }

  for (const cat of WNIOSKI_DATABASE) {
    const catCustom = (byCat.get(cat.id) ?? []).map((e) => ({
      id: e.id,
      text: e.text,
      isCustom: true,
    }));
    const builtIn = cat.items.map((text) => ({
      text,
      isCustom: false,
    }));
    result.push({
      id: cat.id,
      label: cat.label,
      group: cat.group,
      items: [...catCustom, ...builtIn],
    });
  }

  return result;
}

