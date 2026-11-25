import {
  NdstNextSemesterActionKey,
  NdstObservationKey,
  NdstTeacherActionKey,
} from '../types/reports';

export const NDST_OBSERVATION_OPTIONS: { key: NdstObservationKey; label: string }[] = [
  {
    key: 'czeste_nieobecnosci',
    label: 'częste nieobecności na lekcji, brak bieżącego nadrabiania zaległości',
  },
  {
    key: 'unikanie_prac_pisemnych',
    label: 'unikanie prac pisemnych',
  },
  {
    key: 'niewykonywanie_prac_domowych',
    label: 'niewykonywanie prac domowych',
  },
  {
    key: 'brak_zeszytu',
    label: 'brak zeszytu przedmiotowego lub prowadzony niesystematycznie',
  },
  {
    key: 'brak_pracy_na_lekcji',
    label: 'brak pracy na lekcji',
  },
  {
    key: 'nieopanowanie_wymagan_pisemnych',
    label: 'nieopanowanie przez ucznia wymagań na ocenę dopuszczającą z prac pisemnych',
  },
  {
    key: 'brak_aktywnego_udzialu',
    label: 'brak aktywnego udziału w lekcji',
  },
  {
    key: 'odmawianie_odpowiedzi',
    label: 'odmawianie odpowiedzi ustnej',
  },
  {
    key: 'wiekszosc_ocen_ndst',
    label: 'większość zdobytych ocen cząstkowych, to oceny niedostateczne',
  },
  {
    key: 'liczne_uwagi_o_brakach',
    label: 'liczne uwagi ustne o brakach i nieprzygotowaniu do zajęć',
  },
  {
    key: 'niewykorzystanie_form_pomocy',
    label: 'niewykorzystanie oferowanych przez nauczyciela form pomocy',
  },
  {
    key: 'brak_lub_negatywny_wynik_poprawy',
    label: 'niepodejmowanie lub negatywny wynik z proponowanych przez nauczyciela form poprawy oceny',
  },
];

export const NDST_TEACHER_ACTION_OPTIONS: { key: NdstTeacherActionKey; label: string }[] = [
  {
    key: 'biezace_informowanie_ucznia',
    label: 'bieżące informowanie ucznia o jego sytuacji na przedmiocie',
  },
  {
    key: 'motywowanie_do_pracy',
    label: 'motywowanie ucznia do systematycznej pracy',
  },
  {
    key: 'przedstawienie_konsekwencji',
    label: 'przedstawienie uczniowi konsekwencji nieopanowania podstawowych umiejętności i wiadomości',
  },
  {
    key: 'przedstawienie_harmonogramu_poprawy',
    label: 'przedstawienie uczniowi sposobu / harmonogramu poprawy sytuacji z przedmiotu',
  },
  {
    key: 'wielokrotne_rozmowy_z_uczniem',
    label: 'przeprowadzenie wielokrotnych rozmów z uczniem',
  },
  {
    key: 'wyznaczenie_konsultacji',
    label: 'wyznaczenie uczniowi terminów konsultacji nauczycielskich',
  },
  {
    key: 'dodatkowe_zadania',
    label: 'zaproponowanie wykonywania dodatkowych zadań, poleceń dających uczniowi szansę poprawy sytuacji szkolnej z przedmiotu',
  },
  {
    key: 'dostosowanie_tempa_pracy',
    label: 'dostosowanie tempa pracy do możliwości psychofizycznych ucznia',
  },
  {
    key: 'pomoc_na_biezaco_na_lekcji',
    label: 'udzielanie uczniowi pomocy na bieżąco w trakcie trwania zajęć lekcyjnych',
  },
  {
    key: 'stwarzanie_mozliwosci_pozytywnej_oceny',
    label: 'stwarzanie uczniowi możliwości zdobycia pozytywnej oceny w trakcie zajęć lekcyjnych',
  },
  {
    key: 'czesta_kontrola_prac_i_zeszytow',
    label: 'częsta kontrola pracy i zeszytów ucznia',
  },
  {
    key: 'skierowanie_na_zajecia_dodatkowe',
    label: 'skierowanie ucznia na zajęcia zespołu dydaktyczno – wyrównawczego lub na zajęcia dodatkowe pozalekcyjne',
  },
  {
    key: 'powiadomienie_wychowawcy',
    label: 'powiadomienie wychowawcy klasy o sytuacji ucznia',
  },
  {
    key: 'powiadomienie_rodzicow',
    label: 'powiadomienie rodziców/prawnych opiekunów ucznia',
  },
  {
    key: 'poinstruowanie_rodzicow',
    label: 'poinstruowanie rodziców ucznia, w jaki sposób należy pracować z dzieckiem, aby nadrobiło ono braki',
  },
  {
    key: 'powiadomienie_pedagoga',
    label: 'powiadomienie pedagoga szkolnego o sytuacji ucznia',
  },
  {
    key: 'inne_dzialania',
    label: 'inne',
  },
];

export const NDST_NEXT_SEMESTER_OPTIONS: { key: NdstNextSemesterActionKey; label: string }[] = [
  {
    key: 'motywowanie_systematycznej_pracy',
    label: 'motywowanie do bardziej systematycznej pracy',
  },
  {
    key: 'kontakty_z_wychowawca',
    label: 'częste kontakty nauczyciela z wychowawcą klasy',
  },
  {
    key: 'wspolpraca_nauczyciel_wychowawca_rodzice',
    label: 'regularna współpraca nauczyciela, wychowawcy i rodziców',
  },
  {
    key: 'wyznaczenie_terminow_uzupelnienia',
    label: 'wyznaczenie terminów uzupełnienia zaległych wiadomości',
  },
  {
    key: 'organizacja_zajec_lub_samopomocy',
    label: 'organizacja dodatkowych zajęć wyrównawczych lub pomoc w zorganizowaniu samopomocy koleżeńskiej',
  },
  {
    key: 'inne_nastepny_semestr',
    label: 'inne',
  },
];
