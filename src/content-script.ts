const THEME = '#0f1b84';

const questionsElement = Array.from(document.querySelectorAll('h3'))
    .filter(e => e.textContent === 'Questions')[0]
    .parentElement;

const cleanse = (s: string) => s.replace(/[^a-z0-9]/gi, '_').toLowerCase();

const getSubmission = async (problem: string, student: string) => {
    return await (await fetch('https://runestone.academy/ns/assessment/gethist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            acid: problem,
            sid: student,
        }),
    })).json() as HistoryResponse;
};

const getGrade = async (problem: string, student: string) => {
    return await (await fetch(`https://runestone.academy/runestone/admin/getGradeComments?acid=${problem}&sid=${student}`, {
        method: 'GET',
    })).json() as GradeResponse;
};

const getProblems = () => (
    Array.from(
        (
            document.querySelector('#questionselector') as HTMLSelectElement
        ).selectedOptions
    ) as HTMLOptionElement[]
).map(e => e.value);

const getStudents = () => (
    Array.from(document.querySelectorAll('#studentselector option')) as HTMLOptionElement[]
).map(e => ({id: e.value, name: e.textContent}));

const sendRequests = async (statusElement: HTMLDivElement) => {
    statusElement.textContent = 'Starting...';
    const problems = getProblems();
    const students = getStudents();

    await chrome.runtime.sendMessage({
        body: JSON.stringify({
            problems: problems,
            students: students,
            type: "submissioncount"
        })
    });
};

const getButton = () => {
    const b = document.createElement('button');
    b.className = 'btn btn-primary';
    b.style.setProperty('background-color', THEME, 'important');
    b.style.display = 'block';
    const s = document.createElement('div');
    s.style.display = 'block';
    const w = document.createElement('div');
    w.appendChild(b);
    w.appendChild(s);
    return {wrapper: w, button: b, status: s};
};

const createDownloaderButton = () => {
    const {button: b, status: s, wrapper: w} = getButton();
    b.innerText = 'Download All Student Submissions for Selected Problems';
    questionsElement.appendChild(w);
    b.addEventListener('click', e => {
        b.blur();
        sendRequests(s);
    });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mark2Of2s = async (statusElement: HTMLDivElement) => {
    statusElement.textContent = 'Starting...';
    const problems = getProblems();
    const students = getStudents();

    chrome.runtime.sendMessage({
        command: "sendReq",
        body: {problems, students, type: "submissioncount"}
    });
};

const createMark2Of2Button = () => {
    const {button: b, status: s, wrapper: w} = getButton();
    b.innerText = 'Retrieve Fullscore 2 of 2 Submissions for Selected Problems';
    questionsElement.appendChild(w);
    b.addEventListener('click', e => {
        b.blur();
        mark2Of2s(s);
    });
};

// createDownloaderButton();
createMark2Of2Button();
