import JSZip from 'jszip';
import {saveAs} from 'file-saver';

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
    const promises = [];
    const suspicious: {
        problem: string;
        student: { name: string; id: string; };
    }[] = [];
    problems.forEach(problem => {
        students.forEach(async student => {
            promises.push((async () => {
                const {grade} = await getGrade(problem, student.id);
                console.log(`Retrieved grade for ${student.name}'s ${problem} submission`);
                if (grade === 10) {
                    let done = false;
                    while (!done) {
                        try {
                            const history = (await getSubmission(problem, student.id))
                                .detail.history;
                            if (history.length === 2) {
                                suspicious.push({
                                    problem,
                                    student: {
                                        name: student.name,
                                        id: student.id
                                    },
                                });
                            }
                            statusElement.textContent = `Downloaded ${student.name}'s ${problem} submission`;
                            done = true;
                        } catch (e) {
                            statusElement.textContent = `Retrying ${student.name}'s ${problem} submission`;
                        }
                    }
                }
            })());
        });
    });
    await Promise.allSettled(promises);
    statusElement.textContent = '';
    const label = document.createElement('div');
    label.innerText = 'Suspicious Submissions:';
    statusElement.appendChild(label);
    suspicious.forEach(({problem, student}) => {
        const problemElement = document.createElement('div');
        problemElement.style.backgroundColor = 'rgb(150, 150, 150);';
        problemElement.style.color = 'white';
        problemElement.style.padding = '5px';
        problemElement.style.margin = '5px';
        problemElement.style.width = 'fit-content';
        problemElement.style.backgroundColor = '#1f1f1f';
        problemElement.style.borderRadius = '5px';
        problemElement.textContent = `${problem} by ${student.name}`;
        // const diffElement = document.createElement('div');
        // diffElement.style.display = 'none';
        // problemElement.appendChild(diffElement);
        statusElement.appendChild(problemElement);
        const studentSelector = document.querySelector('#studentselector') as HTMLSelectElement;
        const parentElement = studentSelector.parentElement;
        problemElement.addEventListener('click', async e => {
            (parentElement.querySelector(`option[value="${student.id}"]`) as HTMLOptionElement).selected = true;
            await sleep(100);
            studentSelector.dispatchEvent(new Event('change'));
        });
        problemElement.style.cursor = 'pointer';

        // let show = false;
        // let initial = true;
        // let diffLib: Diff2HtmlUI | undefined = undefined;
        // problemElement.addEventListener('click', async e => {
        //   diffElement.style.display = show ? 'none' : 'block';
        //   show = !show;
        //   if (initial) {
        //     initial = false;
        //     const submission = (await getSubmission(problem, student.id))
        //       .detail.history;
        //     console.log(submission);
        //     const initialSubmission = submission[0] ?? '';
        //     const finalSubmission = submission[1] ?? '';
        //     initial = false;
        //     const parsed = createPatch(
        //       'submission.py',
        //       initialSubmission,
        //       finalSubmission,
        //       '',
        //       ''
        //     );
        //     diffLib = new Diff2HtmlUI(
        //       diffElement,
        //       parsed
        //     );
        //     diffLib.draw();
        //     diffElement.style.display = 'block';
        //   }
        // });
        // diffElement.addEventListener('click', e => e.stopPropagation());

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

createDownloaderButton();
createMark2Of2Button();
