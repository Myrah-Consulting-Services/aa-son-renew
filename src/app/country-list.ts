import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CountryList {
  countryList: any[] = [
          {
              "id": 1,
              "name": "United Arab Emirates",
              "phone_code": "+971",
              "gcc":true,
              "notes": "GPSSA will be applicable based on the work location as per the Unified Law of Insurance Protection Extension to provide pensions and Social Security for the citizens of United Arab Emirates."
          },
          {
              "id": 2,
              "name": "Afghanistan",
              "phone_code": "+93"
          },
          {
              "id": 3,
              "name": "Albania",
              "phone_code": "+355"
          },
          {
              "id": 4,
              "name": "Algeria",
              "phone_code": "+213"
          },
          {
              "id": 5,
              "name": "Andorra",
              "phone_code": "+376"
          },
          {
              "id": 6,
              "name": "Angola",
              "phone_code": "+244"
          },
          {
              "id": 7,
              "name": "Antigua and Barbuda",
              "phone_code": "+1-268"
          },
          {
              "id": 8,
              "name": "Argentina",
              "phone_code": "+54"
          },
          {
              "id": 9,
              "name": "Armenia",
              "phone_code": "+374"
          },
          {
              "id": 10,
              "name": "Australia",
              "phone_code": "+61"
          },
          {
              "id": 11,
              "name": "Austria",
              "phone_code": "+43"
          },
          {
              "id": 12,
              "name": "Azerbaijan",
              "phone_code": "+994"
          },
          {
              "id": 13,
              "name": "Bahamas",
              "phone_code": "+1-242"
          },
          {
              "id": 14,
              "name": "Bahrain",
              "phone_code": "+973",
              "gcc":true,
              "notes": "Social Insurance Organizaton (SIO) will be applicable for this Employee as per the Unified Law of Insurance Protection Extension to provide pensions and Social Security for the citizens of Bahrain."
          },
          {
              "id": 15,
              "name": "Bangladesh",
              "phone_code": "+880"
          },
          {
              "id": 16,
              "name": "Barbados",
              "phone_code": "+1-246"
          },
          {
              "id": 17,
              "name": "Belarus",
              "phone_code": "+375"
          },
          {
              "id": 18,
              "name": "Belgium",
              "phone_code": "+32"
          },
          {
              "id": 19,
              "name": "Belize",
              "phone_code": "+501"
          },
          {
              "id": 20,
              "name": "Benin",
              "phone_code": "+229"
          },
          {
              "id": 21,
              "name": "Bhutan",
              "phone_code": "+975"
          },
          {
              "id": 22,
              "name": "Bolivia",
              "phone_code": "+591"
          },
          {
              "id": 23,
              "name": "Bosnia and Herzegovina",
              "phone_code": "+387"
          },
          {
              "id": 24,
              "name": "Botswana",
              "phone_code": "+267"
          },
          {
              "id": 25,
              "name": "Brazil",
              "phone_code": "+55"
          },
          {
              "id": 26,
              "name": "Brunei",
              "phone_code": "+673"
          },
          {
              "id": 27,
              "name": "Bulgaria",
              "phone_code": "+359"
          },
          {
              "id": 28,
              "name": "Burkina Faso",
              "phone_code": "+226"
          },
          {
              "id": 29,
              "name": "Burundi",
              "phone_code": "+257"
          },
          {
              "id": 30,
              "name": "Cabo Verde",
              "phone_code": "+238"
          },
          {
              "id": 31,
              "name": "Cambodia",
              "phone_code": "+855"
          },
          {
              "id": 32,
              "name": "Cameroon",
              "phone_code": "+237"
          },
          {
              "id": 33,
              "name": "Canada",
              "phone_code": "+1"
          },
          {
              "id": 34,
              "name": "Central African Republic",
              "phone_code": "+236"
          },
          {
              "id": 35,
              "name": "Chad",
              "phone_code": "+235"
          },
          {
              "id": 36,
              "name": "Chile",
              "phone_code": "+56"
          },
          {
              "id": 37,
              "name": "China",
              "phone_code": "+86"
          },
          {
              "id": 38,
              "name": "Colombia",
              "phone_code": "+57"
          },
          {
              "id": 39,
              "name": "Comoros",
              "phone_code": "+269"
          },
          {
              "id": 40,
              "name": "Congo",
              "phone_code": "+242"
          },
          {
              "id": 41,
              "name": "Costa Rica",
              "phone_code": "+506"
          },
          {
              "id": 42,
              "name": "Croatia",
              "phone_code": "+385"
          },
          {
              "id": 43,
              "name": "Cuba",
              "phone_code": "+53"
          },
          {
              "id": 44,
              "name": "Cyprus",
              "phone_code": "+357"
          },
          {
              "id": 45,
              "name": "Czech Republic",
              "phone_code": "+420"
          },
          {
              "id": 46,
              "name": "Denmark",
              "phone_code": "+45"
          },
          {
              "id": 47,
              "name": "Djibouti",
              "phone_code": "+253"
          },
          {
              "id": 48,
              "name": "Dominica",
              "phone_code": "+1-767"
          },
          {
              "id": 49,
              "name": "Dominican Republic",
              "phone_code": "+1-809"
          },
          {
              "id": 50,
              "name": "Ecuador",
              "phone_code": "+593"
          },
          {
              "id": 51,
              "name": "Egypt",
              "phone_code": "+20"
          },
          {
              "id": 52,
              "name": "El Salvador",
              "phone_code": "+503"
          },
          {
              "id": 53,
              "name": "Equatorial Guinea",
              "phone_code": "+240"
          },
          {
              "id": 54,
              "name": "Eritrea",
              "phone_code": "+291"
          },
          {
              "id": 55,
              "name": "Estonia",
              "phone_code": "+372"
          },
          {
              "id": 56,
              "name": "Eswatini",
              "phone_code": "+268"
          },
          {
              "id": 57,
              "name": "Ethiopia",
              "phone_code": "+251"
          },
          {
              "id": 58,
              "name": "Fiji",
              "phone_code": "+679"
          },
          {
              "id": 59,
              "name": "Finland",
              "phone_code": "+358"
          },
          {
              "id": 60,
              "name": "France",
              "phone_code": "+33"
          },
          {
              "id": 61,
              "name": "Gabon",
              "phone_code": "+241"
          },
          {
              "id": 62,
              "name": "Gambia",
              "phone_code": "+220"
          },
          {
              "id": 63,
              "name": "Georgia",
              "phone_code": "+995"
          },
          {
              "id": 64,
              "name": "Germany",
              "phone_code": "+49"
          },
          {
              "id": 65,
              "name": "Ghana",
              "phone_code": "+233"
          },
          {
              "id": 66,
              "name": "Greece",
              "phone_code": "+30"
          },
          {
              "id": 67,
              "name": "Grenada",
              "phone_code": "+1-473"
          },
          {
              "id": 68,
              "name": "Guatemala",
              "phone_code": "+502"
          },
          {
              "id": 69,
              "name": "Guinea",
              "phone_code": "+224"
          },
          {
              "id": 70,
              "name": "Guinea-Bissau",
              "phone_code": "+245"
          },
          {
              "id": 71,
              "name": "Guyana",
              "phone_code": "+592"
          },
          {
              "id": 72,
              "name": "Haiti",
              "phone_code": "+509"
          },
          {
              "id": 73,
              "name": "Honduras",
              "phone_code": "+504"
          },
          {
              "id": 74,
              "name": "Hungary",
              "phone_code": "+36"
          },
          {
              "id": 75,
              "name": "Iceland",
              "phone_code": "+354"
          },
          {
              "id": 76,
              "name": "India",
              "phone_code": "+91"
          },
          {
              "id": 77,
              "name": "Indonesia",
              "phone_code": "+62"
          },
          {
              "id": 78,
              "name": "Iran",
              "phone_code": "+98"
          },
          {
              "id": 79,
              "name": "Iraq",
              "phone_code": "+964"
          },
          {
              "id": 80,
              "name": "Ireland",
              "phone_code": "+353"
          },
          {
              "id": 81,
              "name": "Israel",
              "phone_code": "+972"
          },
          {
              "id": 82,
              "name": "Italy",
              "phone_code": "+39"
          },
          {
              "id": 83,
              "name": "Jamaica",
              "phone_code": "+1-876"
          },
          {
              "id": 84,
              "name": "Japan",
              "phone_code": "+81"
          },
          {
              "id": 85,
              "name": "Jordan",
              "phone_code": "+962"
          },
          {
              "id": 86,
              "name": "Kazakhstan",
              "phone_code": "+7"
          },
          {
              "id": 87,
              "name": "Kenya",
              "phone_code": "+254"
          },
          {
              "id": 88,
              "name": "Kiribati",
              "phone_code": "+686"
          },
          {
              "id": 89,
              "name": "Kuwait",
              "phone_code": "+965",
              "gcc":true,
              "notes": "Public Institute for Social Security (PIFSS) will be applicable for this Employee as per the Unified Law of Insurance Protection Extension to provide pensions and Social Security for the citizens of Kuwait."
          },
          {
              "id": 90,
              "name": "Kyrgyzstan",
              "phone_code": "+996"
          },
          {
              "id": 91,
              "name": "Laos",
              "phone_code": "+856"
          },
          {
              "id": 92,
              "name": "Latvia",
              "phone_code": "+371"
          },
          {
              "id": 93,
              "name": "Lebanon",
              "phone_code": "+961"
          },
          {
              "id": 94,
              "name": "Lesotho",
              "phone_code": "+266"
          },
          {
              "id": 95,
              "name": "Liberia",
              "phone_code": "+231"
          },
          {
              "id": 96,
              "name": "Libya",
              "phone_code": "+218"
          },
          {
              "id": 97,
              "name": "Liechtenstein",
              "phone_code": "+423"
          },
          {
              "id": 98,
              "name": "Lithuania",
              "phone_code": "+370"
          },
          {
              "id": 99,
              "name": "Luxembourg",
              "phone_code": "+352"
          },
          {
              "id": 100,
              "name": "Madagascar",
              "phone_code": "+261"
          },
          {
              "id": 101,
              "name": "Malawi",
              "phone_code": "+265"
          },
          {
              "id": 102,
              "name": "Malaysia",
              "phone_code": "+60"
          },
          {
              "id": 103,
              "name": "Maldives",
              "phone_code": "+960"
          },
          {
              "id": 104,
              "name": "Mali",
              "phone_code": "+223"
          },
          {
              "id": 105,
              "name": "Malta",
              "phone_code": "+356"
          },
          {
              "id": 106,
              "name": "Marshall Islands",
              "phone_code": "+692"
          },
          {
              "id": 107,
              "name": "Mauritania",
              "phone_code": "+222"
          },
          {
              "id": 108,
              "name": "Mauritius",
              "phone_code": "+230"
          },
          {
              "id": 109,
              "name": "Mexico",
              "phone_code": "+52"
          },
          {
              "id": 110,
              "name": "Micronesia",
              "phone_code": "+691"
          },
          {
              "id": 111,
              "name": "Moldova",
              "phone_code": "+373"
          },
          {
              "id": 112,
              "name": "Monaco",
              "phone_code": "+377"
          },
          {
              "id": 113,
              "name": "Mongolia",
              "phone_code": "+976"
          },
          {
              "id": 114,
              "name": "Montenegro",
              "phone_code": "+382"
          },
          {
              "id": 115,
              "name": "Morocco",
              "phone_code": "+212"
          },
          {
              "id": 116,
              "name": "Mozambique",
              "phone_code": "+258"
          },
          {
              "id": 117,
              "name": "Myanmar",
              "phone_code": "+95"
          },
          {
              "id": 118,
              "name": "Namibia",
              "phone_code": "+264"
          },
          {
              "id": 119,
              "name": "Nauru",
              "phone_code": "+674"
          },
          {
              "id": 120,
              "name": "Nepal",
              "phone_code": "+977"
          },
          {
              "id": 121,
              "name": "Netherlands",
              "phone_code": "+31"
          },
          {
              "id": 122,
              "name": "New Zealand",
              "phone_code": "+64"
          },
          {
              "id": 123,
              "name": "Nicaragua",
              "phone_code": "+505"
          },
          {
              "id": 124,
              "name": "Niger",
              "phone_code": "+227"
          },
          {
              "id": 125,
              "name": "Nigeria",
              "phone_code": "+234"
          },
          {
              "id": 126,
              "name": "North Korea",
              "phone_code": "+850"
          },
          {
              "id": 127,
              "name": "North Macedonia",
              "phone_code": "+389"
          },
          {
              "id": 128,
              "name": "Norway",
              "phone_code": "+47"
          },
          {
              "id": 129,
              "name": "Oman",
              "phone_code": "+968",
              "gcc":true,
              "notes": "Social Protection Fund (SPF) will be applicable for this Employee as per the Unified Law of Insurance Protection Extension to provide pensions and Social Security for the citizens of Oman."
          },
          {
              "id": 130,
              "name": "Pakistan",
              "phone_code": "+92"
          },
          {
              "id": 131,
              "name": "Palau",
              "phone_code": "+680"
          },
          {
              "id": 132,
              "name": "Palestine",
              "phone_code": "+970"
          },
          {
              "id": 133,
              "name": "Panama",
              "phone_code": "+507"
          },
          {
              "id": 134,
              "name": "Papua New Guinea",
              "phone_code": "+675"
          },
          {
              "id": 135,
              "name": "Paraguay",
              "phone_code": "+595"
          },
          {
              "id": 136,
              "name": "Peru",
              "phone_code": "+51"
          },
          {
              "id": 137,
              "name": "Philippines",
              "phone_code": "+63"
          },
          {
              "id": 138,
              "name": "Poland",
              "phone_code": "+48"
          },
          {
              "id": 139,
              "name": "Portugal",
              "phone_code": "+351"
          },
          {
              "id": 140,
              "name": "Qatar",
              "phone_code": "+974",
              "gcc":true,
              "notes": "General Retirement and Social Insurance Authority (GRSIA) will be applicable for this Employee as per the Unified Law of Insurance Protection Extension to provide pensions and Social Security for the citizens of Qatar."
          },
          {
              "id": 141,
              "name": "Romania",
              "phone_code": "+40"
          },
          {
              "id": 142,
              "name": "Russia",
              "phone_code": "+7"
          },
          {
              "id": 143,
              "name": "Rwanda",
              "phone_code": "+250"
          },
          {
              "id": 144,
              "name": "Saint Kitts and Nevis",
              "phone_code": "+1-869"
          },
          {
              "id": 145,
              "name": "Saint Lucia",
              "phone_code": "+1-758"
          },
          {
              "id": 146,
              "name": "Saint Vincent and the Grenadines",
              "phone_code": "+1-784"
          },
          {
              "id": 147,
              "name": "Samoa",
              "phone_code": "+678"
          },
          {
              "id": 148,
              "name": "San Marino",
              "phone_code": "+378"
          },
          {
              "id": 149,
              "name": "Sao Tome and Principe",
              "phone_code": "+239"
          },
          {
              "id": 150,
              "name": "Saudi Arabia",
              "phone_code": "+966",
              "gcc":true,
              "notes": " General Organization for Social Insurance (GOSI) will be applicable for this Employee as per the Unified Law of Insurance Protection Extension to provide pensions and Social Security for the citizens of Saudi."
          },
          {
              "id": 151,
              "name": "Senegal",
              "phone_code": "+221"
          },
          {
              "id": 152,
              "name": "Serbia",
              "phone_code": "+381"
          },
          {
              "id": 153,
              "name": "Seychelles",
              "phone_code": "+248"
          },
          {
              "id": 154,
              "name": "Sierra Leone",
              "phone_code": "+232"
          },
          {
              "id": 155,
              "name": "Singapore",
              "phone_code": "+65"
          },
          {
              "id": 156,
              "name": "Slovakia",
              "phone_code": "+421"
          },
          {
              "id": 157,
              "name": "Slovenia",
              "phone_code": "+386"
          },
          {
              "id": 158,
              "name": "Solomon Islands",
              "phone_code": "+677"
          },
          {
              "id": 159,
              "name": "Somalia",
              "phone_code": "+252"
          },
          {
              "id": 160,
              "name": "South Africa",
              "phone_code": "+27"
          },
          {
              "id": 161,
              "name": "South Korea",
              "phone_code": "+82"
          },
          {
              "id": 162,
              "name": "South Sudan",
              "phone_code": "+211"
          },
          {
              "id": 163,
              "name": "Spain",
              "phone_code": "+34"
          },
          {
              "id": 164,
              "name": "Sri Lanka",
              "phone_code": "+94"
          },
          {
              "id": 165,
              "name": "Sudan",
              "phone_code": "+249"
          },
          {
              "id": 166,
              "name": "Suriname",
              "phone_code": "+597"
          },
          {
              "id": 167,
              "name": "Sweden",
              "phone_code": "+46"
          },
          {
              "id": 168,
              "name": "Switzerland",
              "phone_code": "+41"
          },
          {
              "id": 169,
              "name": "Syria",
              "phone_code": "+963"
          },
          {
              "id": 170,
              "name": "Taiwan",
              "phone_code": "+886"
          },
          {
              "id": 171,
              "name": "Tajikistan",
              "phone_code": "+992"
          },
          {
              "id": 172,
              "name": "Tanzania",
              "phone_code": "+255"
          },
          {
              "id": 173,
              "name": "Thailand",
              "phone_code": "+66"
          },
          {
              "id": 174,
              "name": "Timor-Leste",
              "phone_code": "+670"
          },
          {
              "id": 175,
              "name": "Togo",
              "phone_code": "+228"
          },
          {
              "id": 176,
              "name": "Tonga",
              "phone_code": "+676"
          },
          {
              "id": 177,
              "name": "Trinidad and Tobago",
              "phone_code": "+1-868"
          },
          {
              "id": 178,
              "name": "Tunisia",
              "phone_code": "+216"
          },
          {
              "id": 179,
              "name": "Turkey",
              "phone_code": "+90"
          },
          {
              "id": 180,
              "name": "Turkmenistan",
              "phone_code": "+993"
          },
          {
              "id": 181,
              "name": "Tuvalu",
              "phone_code": "+688"
          },
          {
              "id": 182,
              "name": "Uganda",
              "phone_code": "+256"
          },
          {
              "id": 183,
              "name": "Ukraine",
              "phone_code": "+380"
          },
          {
              "id": 184,
              "name": "United Kingdom",
              "phone_code": "+44"
          },
          {
              "id": 185,
              "name": "United States",
              "phone_code": "+1"
          },
          {
              "id": 186,
              "name": "Uruguay",
              "phone_code": "+598"
          },
          {
              "id": 187,
              "name": "Uzbekistan",
              "phone_code": "+998"
          },
          {
              "id": 188,
              "name": "Vanuatu",
              "phone_code": "+678"
          },
          {
              "id": 189,
              "name": "Vatican City",
              "phone_code": "+379"
          },
          {
              "id": 190,
              "name": "Venezuela",
              "phone_code": "+58"
          },
          {
              "id": 191,
              "name": "Vietnam",
              "phone_code": "+84"
          },
          {
              "id": 192,
              "name": "Yemen",
              "phone_code": "+967"
          },
          {
              "id": 193,
              "name": "Zambia",
              "phone_code": "+260"
          },
          {
              "id": 194,
              "name": "Zimbabwe",
              "phone_code": "+263"
          }
      ];

    GccCountryList: any[] = [
      {
        "id": 1,
        "name": "U.A.E.",
        "phone_code": "+971",
      },
      {
        "id": 140,
        "name": "Qatar",
        "phone_code": "+974",
      },
      {
        "id": 150,
        "name": "Saudi Arabia",
        "phone_code": "+966",
      },
      {
        "id": 89,
        "name": "Kuwait",
        "phone_code": "+965",
      },
      {
        "id": 129,
        "name": "Oman",
        "phone_code": "+968",
      },
      {
        "id": 14,
        "name": "Bahrain",
        "phone_code": "+973",
      },
    ];
}
