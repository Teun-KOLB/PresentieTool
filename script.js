// Lijst met clienten die aangepaste zorg hebben, TODO Versimpelen en modulairder maken
const SPECIAL_CONFIG = {
    'finn': { fields: [{ activity: 'Dienstpassend onderwijs', minutes: 60 }, { activity: 'Individuele begeleiding', minutes: 30 }] },

    'bjorn': { fields: [{ activity: 'Dienstpassend onderwijs', minutes: 60 }, { activity: 'Individuele begeleiding', minutes: 30 }] },

    'djayden': { fields: [{ activity: 'Dienstpassend onderwijs', minutes: 60 }, { activity: 'Individuele begeleiding', minutes: 30 }] },

    'norbert': { fields: [{ activity: 'Dienstpassend onderwijs', minutes: 60 }, { activity: 'Individuele begeleiding', minutes: 30 }] },

    'jippe': { fields: [{ activity: 'Dienstpassend onderwijs', minutes: 60 }, { activity: 'Individuele begeleiding', minutes: 30 }] },

    'darison': { fields: [{ activity: 'Dienstpassend onderwijs', minutes: 60 }, { activity: 'Individuele begeleiding', minutes: 30 }] },

    'kaan': { fields: [{ activity: 'Specialistische begeleiding', minutes: 240 }, { activity: 'Individuele begeleiding', minutes: 60 }] },
};
// Rooster generator op basis van filters.
let parsedRoster = {};
// Cleart alle data en verwijderd het gegenereerde rooster.
function clearData() {
    document.getElementById('inputData').value = '';
    document.getElementById('outputContainer').classList.add('hidden');
    document.getElementById('filterControls').classList.add('hidden');
    parsedRoster = {};
}


function parseAndInit() {
    // Bij hergenereren resetten van data
    let currentDay = null;
    let currentBlockTime = null;
    let columnMapping = {};
    parsedRoster = {};

    // Input uit tekstveld, TODO misschien een optie om dit via .csv te doen?
    const input = document.getElementById('inputData').value;
    // Verwijderd whitespaces
    if (!input.trim()) return;
    // Scheidt de data in rijen
    const rows = input.split('\n');


    rows.forEach((row) => {

        const columns = row.split('\t');
        if (columns.length < 2) return;

        const firstCell = columns[0] ? columns[0].trim() : '';

        const dayMatch = firstCell.match(/^(Maandag|Dinsdag|Woensdag|Donderdag|Vrijdag)/i);

        

        if (dayMatch) {

            currentDay = firstCell;

            parsedRoster[currentDay] = {};

            currentBlockTime = null;

            columnMapping = {};

            return;

        }

        if (!currentDay) return;



        const timeCell = columns[1] ? columns[1].trim() : '';

        const timeMatch = timeCell.match(/([0-9]{1,2}:[0-9]{2})/);

        

        if (timeMatch) {

            currentBlockTime = timeCell.replace('u','').trim();

            parsedRoster[currentDay][currentBlockTime] = { data: {} };

            columnMapping = {};

            for (let i = 2; i < columns.length; i++) {

                const header = columns[i].trim();

                // Filter aangepast: Alleen nog Fase 1 t/m 3 meenemen

                if (header && header.match(/^Fase\s[1-3]$/i)) {

                    columnMapping[i] = header;

                    parsedRoster[currentDay][currentBlockTime].data[header] = [];

                }

            }

            return;

        }



        if (currentBlockTime && Object.keys(columnMapping).length > 0) {

            for (const [colIndex, headerName] of Object.entries(columnMapping)) {

                if (columns[colIndex]) {

                    const rawContent = columns[colIndex].trim();

                    if (rawContent) {

                        const names = rawContent.split(/,|\n/).map(n => n.trim()).filter(n => n);

                        names.forEach(name => {

                            if (!name.match(/^wb[0-9]/i) && name.length > 1) {

                                    const isAbsent = name.includes('(D)');

                                    const isYellow = name.includes('(F)');

                                    const isGreen = name.includes('(B)');

                                    const isGreyZero = name.includes('(E)');

                                    const isGreyKeep = name.includes('(G)');

                                

                                    const cleanName = name

                                    .replace(/\([A-Z]\)/g, '')

                                    .trim();



                                    if(cleanName) {

                                    parsedRoster[currentDay][currentBlockTime].data[headerName].push({

                                        name: cleanName,

                                        absent: isAbsent,

                                        yellowMark: isYellow,

                                        greenMark: isGreen,

                                        greyZeroMark: isGreyZero,

                                        greyKeepMark: isGreyKeep,

                                        originalHeader: headerName

                                    });

                                    }

                            }

                        });

                    }

                }

            }

        }

    });

    populateDayDropdown();

    document.getElementById('filterControls').classList.remove('hidden');

    renderTable();

}



function populateDayDropdown() {

    const select = document.getElementById('daySelect');

    select.innerHTML = '';

    const days = Object.keys(parsedRoster);

    days.forEach(day => {

        const option = document.createElement('option');

        option.value = day;

        option.textContent = day;

        select.appendChild(option);

    });

    if(days.length > 0) select.value = days[0];

}



function getDurationInMinutes(timeStr, nextTimeStr) {

    const toMins = (t) => {

        if(!t) return 0;

        const [h, m] = t.split(':').map(Number);

        return h * 60 + m;

    };

    const start = toMins(timeStr);

    const end = nextTimeStr ? toMins(nextTimeStr) : start + 60;

    return Math.max(0, end - start);

}



function renderTable() {

    const selectedDay = document.getElementById('daySelect').value;

    const selectedPhase = document.getElementById('phaseSelect').value;

    const container = document.getElementById('outputContainer');

    

    container.innerHTML = '';

    container.classList.remove('hidden');

    if (!parsedRoster[selectedDay]) return;

    const dayData = parsedRoster[selectedDay];

    

    let timeKeys = Object.keys(dayData).sort((a, b) => {

        const aVal = parseInt(a.replace(':', ''));

        const bVal = parseInt(b.replace(':', ''));

        return aVal - bVal;

    });



    let blockDurations = {};

    timeKeys.forEach((time, index) => {

        const nextTime = timeKeys[index + 1];

        blockDurations[time] = getDurationInMinutes(time, nextTime);

    });



    let studentMap = {};

    let cohort = new Set();

    

    timeKeys.forEach(time => {

        const block = dayData[time];

        

        if (selectedPhase === "Alle Cliënten") {

            Object.keys(block.data).forEach(header => {

                block.data[header].forEach(p => cohort.add(p.name));

            });

        } else {

            const hour = parseInt(time.split(':')[0]);

            if (hour < 12) {

                if (block.data[selectedPhase]) {

                    block.data[selectedPhase].forEach(p => cohort.add(p.name));

                }

            }

        }

    });



    cohort.forEach(studentName => {

        let totalMinutes = 0;

        let isInitiallyAbsent = false;

        let isInitiallyYellow = false;

        let isInitiallyGreen = false;

        let isInitiallyGreyZero = false;

        let isInitiallyGreyKeep = false;

        

        timeKeys.forEach(time => {

            const block = dayData[time];

            const duration = blockDurations[time];

            

            let record = null;

            if (selectedPhase === "Alle Cliënten") {

                for (const header in block.data) {

                    const found = block.data[header].find(p => p.name === studentName);

                    if (found) { record = found; break; }

                }

            } else {

                record = block.data[selectedPhase] ? block.data[selectedPhase].find(p => p.name === studentName) : null;

            }

            

            if (record) {

                if (record.absent) isInitiallyAbsent = true;

                if (record.yellowMark) isInitiallyYellow = true;

                if (record.greyZeroMark) isInitiallyGreyZero = true;

                if (record.greyKeepMark) isInitiallyGreyKeep = true;

                if (record.greenMark) isInitiallyGreen = true;



                totalMinutes += duration;

            }

        });

        

        const normalizedName = studentName.toLowerCase();

        let isSplit = false;

        let splitDetails = null;

        let effectiveMinutes = totalMinutes;



        if (SPECIAL_CONFIG[normalizedName]) {

            let config = JSON.parse(JSON.stringify(SPECIAL_CONFIG[normalizedName]));

            const totalConfigMinutes = config.fields.reduce((sum, item) => sum + item.minutes, 0);

            

            effectiveMinutes = (isInitiallyAbsent || isInitiallyGreyZero) ? 0 : totalConfigMinutes;

            

            isSplit = true;

            splitDetails = config.fields;

        } else if (isInitiallyAbsent || isInitiallyGreyZero) {

            effectiveMinutes = 0;

        }



        studentMap[studentName] = {

            name: studentName,

            effectiveMinutes: effectiveMinutes,

            isSplit: isSplit,

            splitDetails: splitDetails,

            isAbsent: isInitiallyAbsent,

            isYellow: isInitiallyYellow,

            isGreen: isInitiallyGreen,

            isGreyZero: isInitiallyGreyZero,

            isGreyKeep: isInitiallyGreyKeep

        };

    });

    

    const students = Object.values(studentMap).sort((a, b) => a.name.localeCompare(b.name));

    

    const headerHTML = `

        <div class="bg-slate-100 p-6 border-b border-slate-200">

            <h2 class="text-xl font-bold text-slate-800">${selectedDay}</h2>

            <p class="text-sm text-slate-500">Overzicht voor <span class="font-semibold text-blue-600">${selectedPhase}</span>.</p>

        </div>

    `;



    const tableStart = `

        <div class="overflow-x-auto">

            <table class="w-full text-left border-collapse">

                <thead>

                    <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">

                        <th class="p-4 font-semibold w-2/3">Naam</th>

                        <th class="p-4 font-semibold w-1/3 text-right">Minuten</th>

                    </tr>

                </thead>

                <tbody class="divide-y divide-slate-100">

    `;



    let tableRows = students.map(student => {

        const isSpecialSplit = student.isSplit;

        let minuteContent = '';

        let minuteClass = 'inline-block px-3 py-1 rounded font-bold';

        

        if (student.isAbsent || student.isGreyZero || student.isGreyKeep) {

            minuteClass += ' text-slate-300';

        } else if (student.isYellow) {

            minuteClass += ' text-yellow-600';

        } else {

            minuteClass += ' text-emerald-600';

        }



        if (isSpecialSplit) {

            let boxColor = 'bg-emerald-50 border-emerald-100';

            let textColor = 'text-emerald-700';



            if (student.isAbsent || student.isGreyZero || student.isGreyKeep) {

                boxColor = 'bg-slate-50 border-slate-100 opacity-50';

                textColor = 'text-slate-400';

            } else if (student.isYellow) {

                boxColor = 'bg-yellow-50 border-yellow-100';

                textColor = 'text-yellow-700';

            }

            

            minuteContent = `<div class="w-full space-y-1">${student.splitDetails.map(detail =>

                `<div class="flex justify-between items-center px-2 py-0.5 rounded-lg border ${boxColor}">

                    <span class="text-[10px] uppercase font-bold ${textColor}">${detail.activity}:</span>

                    <span class="font-mono text-sm font-bold ${textColor}">${detail.minutes} min</span>

                </div>`

            ).join('')}</div>`;

            minuteClass = 'w-full';

        } else {

            minuteContent = student.effectiveMinutes + ' min';

        }



        return `

            <tr class="bg-white hover:bg-slate-50 transition-colors">

                <td class="p-4 align-top font-medium text-slate-700">${student.name}</td>

                <td class="p-4 text-right align-top">

                    <div class="${minuteClass}">${minuteContent}</div>

                </td>

            </tr>`;

    }).join('');

    

    container.innerHTML = headerHTML + tableStart + tableRows + `</tbody></table></div>`;

}