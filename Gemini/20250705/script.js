document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 캐싱
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');

    const minusBtn = document.getElementById('minusBtn');
    const plusBtn = document.getElementById('plusBtn');
    const numChoicesDisplay = document.getElementById('numChoicesDisplay');
    const setCountBtn = document.getElementById('setCountBtn');

    const inputChoicesContainer = document.getElementById('inputChoicesContainer');
    const submitChoicesBtn = document.getElementById('submitChoicesBtn');
    const resetCountBtn = document.getElementById('resetCountBtn');

    const wheel = document.querySelector('.wheel');
    const spinWheelBtn = document.getElementById('spinWheelBtn');
    const reselectCountBtn = document.getElementById('reselectCountBtn');
    const editChoicesBtn = document.getElementById('editChoicesBtn');
    const resultDisplay = document.getElementById('resultDisplay');

    // 상태 변수
    let numberOfChoices = 5; // 초기 선택지 개수
    const minChoices = 2;
    const maxChoices = 12;
    let choiceValues = []; // 사용자가 입력한 선택지 값들

    // 룰렛 색상 팔레트 (CSS의 :root 변수와 일치)
    const colorPalette = [
        'var(--color1)', 'var(--color2)', 'var(--color3)', 'var(--color4)',
        'var(--color5)', 'var(--color6)', 'var(--color7)', 'var(--color8)',
        'var(--color9)', 'var(--color10)', 'var(--color11)', 'var(--color12)'
    ];

    // --- 단계 전환 함수 ---
    function showStep(stepId) {
        step1.classList.add('hidden');
        step2.classList.add('hidden');
        step3.classList.add('hidden');
        document.getElementById(stepId).classList.remove('hidden');
    }

    // --- 1단계: 선택지 개수 설정 관련 함수 ---
    function updateNumChoicesDisplay() {
        numChoicesDisplay.textContent = numberOfChoices;
    }

    minusBtn.addEventListener('click', () => {
        if (numberOfChoices > minChoices) {
            numberOfChoices--;
            updateNumChoicesDisplay();
        }
    });

    plusBtn.addEventListener('click', () => {
        if (numberOfChoices < maxChoices) {
            numberOfChoices++;
            updateNumChoicesDisplay();
        }
    });

    setCountBtn.addEventListener('click', () => {
        generateChoiceInputs();
        showStep('step2');
    });

    // --- 2단계: 선택지 입력 관련 함수 ---
    function generateChoiceInputs() {
        inputChoicesContainer.innerHTML = ''; // 기존 입력 필드 초기화
        choiceValues = []; // 선택지 값 초기화

        for (let i = 0; i < numberOfChoices; i++) {
            const div = document.createElement('div');
            div.classList.add('input-choice-item');

            const label = document.createElement('label');
            label.textContent = `[${i + 1}]`;
            label.setAttribute('for', `choiceInput${i}`);

            const input = document.createElement('input');
            input.type = 'text';
            input.id = `choiceInput${i}`;
            input.placeholder = `선택지 ${i + 1} 입력`;
            // 이전에 입력된 값이 있다면 채워넣기 (선택지 수정 시 유용)
            if (choiceValues[i]) {
                input.value = choiceValues[i];
            } else {
                input.value = `${i + 1}`; // 기본값으로 1부터 10까지 채워넣기 (스크린샷 참고)
            }


            div.appendChild(label);
            div.appendChild(input);
            inputChoicesContainer.appendChild(div);
        }
    }

    submitChoicesBtn.addEventListener('click', () => {
        const inputs = inputChoicesContainer.querySelectorAll('input[type="text"]');
        let allInputsValid = true;
        choiceValues = []; // 새로운 값들로 초기화

        inputs.forEach(input => {
            if (input.value.trim() === '') {
                allInputsValid = false;
                input.focus();
                // alert('모든 선택지를 입력해주세요!'); // 사용자에게 알림 (선택 사항)
                input.style.border = '2px solid var(--red-btn)'; // 경고 표시
            } else {
                choiceValues.push(input.value.trim());
                input.style.border = 'none'; // 경고 제거
            }
        });

        if (allInputsValid) {
            drawWheel(); // 룰렛 그리기
            showStep('step3');
            resultDisplay.textContent = ''; // 결과 초기화
        } else {
            alert('모든 선택지를 입력해주세요!');
        }
    });

    resetCountBtn.addEventListener('click', () => {
        showStep('step1');
        // 선택지 개수와 입력된 값 초기화 (선택 사항, 사용자 경험에 따라)
        // numberOfChoices = 5;
        // updateNumChoicesDisplay();
    });

    // 3단계: 룰렛 돌리기 관련 함수
    let currentRotation = 0; // 룰렛의 현재 회전 각도를 추적하는 변수 추가

    function drawWheel() {
        wheel.innerHTML = ''; // 기존 섹터 초기화
        const anglePerSector = 360 / numberOfChoices;

        for (let i = 0; i < numberOfChoices; i++) {
            const sector = document.createElement('div');
            sector.classList.add('sector');
            // 각 섹터의 회전 (룰렛 중앙 기준)
            sector.style.transform = `rotate(${i * anglePerSector}deg)`;
            sector.style.setProperty('--sector-color', colorPalette[i % colorPalette.length]);

            const span = document.createElement('span');
            span.textContent = choiceValues[i];
            
            // 텍스트가 똑바로 보이도록 회전시키는 각도 (CSS에서 이 각도의 역을 사용)
            // 각 섹터의 중심 각도를 `--text-rotation`으로 설정
            // 이 각도는 섹터가 회전한 후 텍스트가 얼마나 틀어졌는지를 나타내는 값
            span.style.setProperty('--text-rotation', `${i * anglePerSector + anglePerSector / 2}deg`);

            sector.appendChild(span);
            wheel.appendChild(sector);
        }
        // 룰렛 초기 회전 각도 재설정 (페이지 로드 또는 재설정 시 항상 시작 위치가 동일하게)
        // 현재 currentRotation 값으로 초기화하여, 선택지 수정 후 다시 돌리기 화면으로 올 때 룰렛이 이상하게 돌아가지 않도록 함.
        wheel.style.transform = `rotate(${currentRotation}deg)`;
    }

    spinWheelBtn.addEventListener('click', () => {
        spinWheelBtn.disabled = true;
        resultDisplay.textContent = ''; // 이전 결과 지우기

        const anglePerSector = 360 / numberOfChoices;
        const winningSectorIndex = Math.floor(Math.random() * numberOfChoices);
        
        // 포인터가 룰렛의 윗쪽(0도)을 가리키므로, 
        // 당첨될 섹터의 중앙이 0도 위치에 오도록 룰렛을 돌려야 합니다.
        // 섹터의 시작 각도: winningSectorIndex * anglePerSector
        // 섹터의 중앙 각도: (winningSectorIndex * anglePerSector) + (anglePerSector / 2)
        
        // 룰렛은 시계방향으로 회전 (CSS rotate 양수)
        // 예를 들어 섹터 0 (0~36도)의 중앙인 18도가 포인터에 오려면 룰렛을 18도 반시계 방향으로 회전시켜야 함.
        // 또는 룰렛을 360 - 18 = 342도 시계방향으로 회전시켜야 함.
        const targetSectorCenterAngle = (winningSectorIndex * anglePerSector) + (anglePerSector / 2);
        
        // 포인터가 정확히 섹터의 중앙을 가리키기 위한 최종 회전량
        // 0도가 포인터 위치라고 가정하고, targetSectorCenterAngle 만큼 반대 방향으로 돌려야 함.
        const rotationToAlign = 360 - targetSectorCenterAngle; 

        // 여러 바퀴 회전하여 무작위성 강화 및 시각적 효과 증대
        const fullSpins = 5; // 최소 5바퀴 (360 * 5 = 1800도)
        const totalRotation = (360 * fullSpins) + rotationToAlign;

        // 현재 룰렛의 회전 각도를 반영하여 다음 회전을 누적
        currentRotation = totalRotation; 
        
        wheel.style.transform = `rotate(${currentRotation}deg)`;

        // 최종 결과 섹터 값
        const finalResult = choiceValues[winningSectorIndex];
        
        const spinDuration = 5000; // 5초
        setTimeout(() => {
            resultDisplay.textContent = `결과 : ${finalResult}`;
            spinWheelBtn.disabled = false;
        }, spinDuration);
    });


    spinWheelBtn.addEventListener('click', () => {
        spinWheelBtn.disabled = true;
        resultDisplay.textContent = ''; // 이전 결과 지우기

        // 룰렛 정지 지점 계산 (포인터가 0도를 가리킨다고 가정)
        // 룰렛이 멈출 때 포인터가 가리키는 섹터의 시작 각도가 0도와 일치해야 함
        // 각 섹터의 각도
        const anglePerSector = 360 / numberOfChoices;
        
        // 당첨될 섹터 인덱스 (0부터 numberOfChoices-1)
        const winningSectorIndex = Math.floor(Math.random() * numberOfChoices);
        
        // 당첨될 섹터의 중심 각도 (룰렛의 맨 위 포인터 기준)
        // 예를 들어 5개 섹터 (0, 1, 2, 3, 4)가 있고, 각 섹터가 72도라면
        // 섹터 0: 0~72도, 섹터 1: 72~144도 ...
        // 당첨될 섹터의 중앙이 포인터에 오도록 회전해야 함.
        // 현재 룰렛의 포인터는 위를 향하고 있으며, 0도 방향
        // 즉, 섹터의 중간 지점을 0도로 맞춰야 함.
        // 섹터 0의 중간은 36도
        // 섹터 1의 중간은 72 + 36 = 108도
        // 섹터 i의 중간은 (i * anglePerSector) + (anglePerSector / 2)
        
        const targetAngleInSector = (winningSectorIndex * anglePerSector) + (anglePerSector / 2);

        // 룰렛의 회전 방향은 시계 방향 (css transform rotate)
        // 포인터가 가리키는 0도(맨 위)에 특정 섹터의 중심이 오도록 하려면
        // 해당 섹터의 중심 각도만큼 룰렛을 반시계 방향으로 돌려야 함.
        // 예를 들어 섹터 0의 중심이 36도에 있다면, 룰렛 전체를 -36도 돌려야 섹터 0의 중심이 0도에 옴
        const rotationToAlign = 360 - targetAngleInSector; // 0도를 기준으로 반시계 방향 회전량
        
        // 여러 바퀴 회전
        const fullSpins = 5; // 최소 5바퀴 회전
        const totalRotation = (360 * fullSpins) + rotationToAlign;

        // 최종 결과 섹터 값
        const finalResult = choiceValues[winningSectorIndex];
        
        wheel.style.transform = `rotate(${totalRotation}deg)`;

        // 회전 애니메이션 종료 후 (CSS transition duration에 맞춰)
        const spinDuration = 5000; // 5초
        setTimeout(() => {
            resultDisplay.textContent = `결과 : ${finalResult}`;
            spinWheelBtn.disabled = false;
        }, spinDuration);
    });

    reselectCountBtn.addEventListener('click', () => {
        showStep('step1');
        resultDisplay.textContent = ''; // 결과 초기화
        // numberOfChoices = 5; // 필요하다면 초기화
        updateNumChoicesDisplay();
    });

    editChoicesBtn.addEventListener('click', () => {
        // 현재 입력된 선택지 값들을 다시 입력 폼에 채워넣기 위해
        // choiceValues 배열을 이용하여 generateChoiceInputs 함수를 호출하기 전에
        // 현재 룰렛에 표시된 텍스트 값들을 choiceValues에 저장해두는 로직이 필요
        // 현재는 drawWheel 시점에 choiceValues를 사용하므로, 수정 버튼 누르면
        // 바로 generateChoiceInputs 호출해도 됨.
        const currentInputs = inputChoicesContainer.querySelectorAll('input[type="text"]');
        if (currentInputs.length === 0) { // 만약 처음부터 수정 버튼 누르는 경우 대비
             generateChoiceInputs();
        } else {
            // 현재 룰렛의 선택지 값을 inputs에 채워넣기
            for(let i = 0; i < numberOfChoices; i++) {
                const inputElement = inputChoicesContainer.querySelector(`#choiceInput${i}`);
                if (inputElement) {
                    inputElement.value = choiceValues[i];
                }
            }
        }
        showStep('step2');
        resultDisplay.textContent = ''; // 결과 초기화
    });

    // 초기 로드 시
    updateNumChoicesDisplay();
    showStep('step1'); // 첫 화면은 1단계로 시작
});