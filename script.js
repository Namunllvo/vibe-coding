document.addEventListener('DOMContentLoaded', () => {
    const numberGrid = document.querySelector('.number-grid');
    const autoSelectBtn = document.getElementById('autoSelectBtn');
    const submitBtn = document.getElementById('submitBtn');
    const titleHeader = document.querySelector('.header .title');

    // 번호 범위 슬라이더 관련 요소
    const maxNumberRangeInput = document.getElementById('maxNumberRange');
    const currentMaxNumberSpan = document.getElementById('currentMaxNumber');

    // 뽑을 개수 슬라이더 관련 요소 (새로 추가)
    const numPicksRangeInput = document.getElementById('numPicksRange');
    const currentNumPicksSpan = document.getElementById('currentNumPicks');

    let selectedNumbers = new Set(); // 중복을 방지하기 위해 Set 사용

    let currentMaxNumber = parseInt(maxNumberRangeInput.value); // 현재 슬라이더 값 (최대 번호)
    let currentNumPicks = parseInt(numPicksRangeInput.value);   // 현재 슬라이더 값 (뽑을 개수)

    // 1부터 currentMaxNumber까지의 숫자 버튼 생성
    function createNumberButtons() {
        numberGrid.innerHTML = ''; // 기존 버튼 모두 제거
        for (let i = 1; i <= currentMaxNumber; i++) {
            const button = document.createElement('button');
            button.classList.add('number-button');
            button.textContent = i;
            button.dataset.number = i; // data-number 속성에 숫자 저장
            button.addEventListener('click', () => toggleNumberSelection(i, button));
            numberGrid.appendChild(button);
            // 이전에 선택되었던 번호가 현재 범위에 있다면 selected 클래스 다시 적용
            if (selectedNumbers.has(i)) {
                button.classList.add('selected');
            }
        }
    }

    // 숫자 선택/해제 로직
    function toggleNumberSelection(number, buttonElement) {
        if (selectedNumbers.has(number)) {
            // 이미 선택된 숫자이면 해제
            selectedNumbers.delete(number);
            buttonElement.classList.remove('selected');
        } else {
            // 새로운 숫자 선택
            if (selectedNumbers.size < currentNumPicks) { // MAX_SELECTION 대신 currentNumPicks 사용
                selectedNumbers.add(number);
                buttonElement.classList.add('selected');
            } else {
                alert(`번호는 ${currentNumPicks}개까지만 선택할 수 있습니다.`);
            }
        }
        updateUI();
    }

    // UI 업데이트 (선택된 번호 수, 제출 버튼 활성화 등)
    function updateUI() {
        if (selectedNumbers.size === currentNumPicks) { // MAX_SELECTION 대신 currentNumPicks 사용
            titleHeader.textContent = `번호 ${currentNumPicks}개 선택 완료`;
            submitBtn.disabled = false;
        } else {
            titleHeader.textContent = `번호 ${currentNumPicks}개를 선택해 주세요`;
            submitBtn.disabled = true;
        }
        // 버튼의 selected 클래스 상태를 selectedNumbers Set과 일치시키기 (특히 자동 선택 후)
        document.querySelectorAll('.number-button').forEach(btn => {
            const num = parseInt(btn.dataset.number);
            if (selectedNumbers.has(num)) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    // 자동 선택하기 로직
    autoSelectBtn.addEventListener('click', () => {
        selectedNumbers.clear(); // 기존 선택 초기화

        const allNumbersInCurrentRange = Array.from({ length: currentMaxNumber }, (_, i) => i + 1); // 현재 범위 내의 숫자 배열 생성
        // 배열을 섞어서 앞에서 currentNumPicks 개 추출 (Fisher-Yates shuffle 알고리즘)
        for (let i = allNumbersInCurrentRange.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allNumbersInCurrentRange[i], allNumbersInCurrentRange[j]] = [allNumbersInCurrentRange[j], allNumbersInCurrentRange[i]];
        }

        // 섞인 배열에서 currentNumPicks 개 선택
        // 만약 currentMaxNumber가 currentNumPicks보다 작으면, currentMaxNumber만큼만 선택
        const numbersToSelect = Math.min(currentNumPicks, currentMaxNumber);
        for (let i = 0; i < numbersToSelect; i++) {
            selectedNumbers.add(allNumbersInCurrentRange[i]);
        }

        updateUI(); // UI 업데이트를 통해 선택된 번호 반영
    });

    // "이 번호로 응모하기" 버튼 클릭 시
    submitBtn.addEventListener('click', () => {
        if (selectedNumbers.size === currentNumPicks) { // MAX_SELECTION 대신 currentNumPicks 사용
            const sortedNumbers = Array.from(selectedNumbers).sort((a, b) => a - b);
            alert(`선택된 번호: ${sortedNumbers.join(', ')}\n이 번호로 응모합니다!`);
            // 여기에 실제 응모 로직 (예: 백엔드 API 호출) 추가
        } else {
            alert(`번호를 ${currentNumPicks}개 선택해 주세요.`);
        }
    });

    // 번호 범위 슬라이더 값 변경 이벤트 리스너
    maxNumberRangeInput.addEventListener('input', () => {
        currentMaxNumber = parseInt(maxNumberRangeInput.value);
        currentMaxNumberSpan.textContent = `1 - ${currentMaxNumber}`;

        // 슬라이더 값이 변경되면 모든 선택 초기화 및 버튼 재생성
        selectedNumbers.clear();
        createNumberButtons();
        updateUI();
    });

    // 뽑을 개수 슬라이더 값 변경 이벤트 리스너 (새로 추가)
    numPicksRangeInput.addEventListener('input', () => {
        currentNumPicks = parseInt(numPicksRangeInput.value);
        currentNumPicksSpan.textContent = `${currentNumPicks}개`;

        // 뽑을 개수가 변경되면 기존 선택된 번호 중 유효한 것만 남기고 초기화
        // 예를 들어, 10개 뽑다가 5개로 줄이면, 5개만 남김
        if (selectedNumbers.size > currentNumPicks) {
            const tempArray = Array.from(selectedNumbers).slice(0, currentNumPicks);
            selectedNumbers = new Set(tempArray);
        }
        // 이 부분에서 createNumberButtons()를 호출할 필요는 없습니다.
        // 번호 범위가 바뀌는 것이 아니기 때문에 기존 버튼은 유효합니다.
        updateUI();
    });


    // 초기화
    createNumberButtons(); // 초기 범위로 버튼 생성
    updateUI(); // 초기 UI 상태 설정
});