document.addEventListener('DOMContentLoaded', () => {
    const numberGrid = document.querySelector('.number-grid');
    const autoSelectBtn = document.getElementById('autoSelectBtn');
    const submitBtn = document.getElementById('submitBtn');
    const titleHeader = document.querySelector('.header .title');

    const maxNumberRangeInput = document.getElementById('maxNumberRange');
    const currentMaxNumberSpan = document.getElementById('currentMaxNumber');

    const numPicksRangeInput = document.getElementById('numPicksRange');
    const currentNumPicksSpan = document.getElementById('currentNumPicks');

    // 새로 변경된 '응모 결과 보기' 버튼 요소 가져오기
    const viewResultsBtn = document.getElementById('viewResultsBtn'); 

    let selectedNumbers = new Set();
    let currentMaxNumber = parseInt(maxNumberRangeInput.value);
    let currentNumPicks = parseInt(numPicksRangeInput.value);

    // 응모 내역을 불러오거나 초기화하는 함수
    function getLotteryEntries() {
        const entriesJSON = localStorage.getItem('lotteryEntries');
        return entriesJSON ? JSON.parse(entriesJSON) : [];
    }

    // 응모 내역을 저장하는 함수
    function saveLotteryEntries(entries) {
        localStorage.setItem('lotteryEntries', JSON.stringify(entries));
    }

    // 1부터 currentMaxNumber까지의 숫자 버튼 생성
    function createNumberButtons() {
        numberGrid.innerHTML = '';
        for (let i = 1; i <= currentMaxNumber; i++) {
            const button = document.createElement('button');
            button.classList.add('number-button');
            button.textContent = i;
            button.dataset.number = i;
            button.addEventListener('click', () => toggleNumberSelection(i, button));
            numberGrid.appendChild(button);
            if (selectedNumbers.has(i)) {
                button.classList.add('selected');
            }
        }
    }

    // 숫자 선택/해제 로직
    function toggleNumberSelection(number, buttonElement) {
        if (selectedNumbers.has(number)) {
            selectedNumbers.delete(number);
            buttonElement.classList.remove('selected');
        } else {
            if (selectedNumbers.size < currentNumPicks) {
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
        if (selectedNumbers.size === currentNumPicks) {
            titleHeader.textContent = `번호 ${currentNumPicks}개 선택 완료`;
            submitBtn.disabled = false;
        } else {
            titleHeader.textContent = `번호 ${currentNumPicks}개를 선택해 주세요`;
            submitBtn.disabled = true;
        }
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
        selectedNumbers.clear();

        const allNumbersInCurrentRange = Array.from({ length: currentMaxNumber }, (_, i) => i + 1);
        for (let i = allNumbersInCurrentRange.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allNumbersInCurrentRange[i], allNumbersInCurrentRange[j]] = [allNumbersInCurrentRange[j], allNumbersInCurrentRange[i]];
        }

        const numbersToSelect = Math.min(currentNumPicks, currentMaxNumber);
        for (let i = 0; i < numbersToSelect; i++) {
            selectedNumbers.add(allNumbersInCurrentRange[i]);
        }
        updateUI();
    });

        // "이 번호로 응모하기" 버튼 클릭 시 로직 (이전 답변과 동일)
    submitBtn.addEventListener('click', () => {
        if (selectedNumbers.size === currentNumPicks) {
            const sortedNumbers = Array.from(selectedNumbers).sort((a, b) => a - b);

            const confirmMessage = `선택된 번호: ${sortedNumbers.join(', ')}\n이 번호로 응모하시겠습니까?`;
            if (confirm(confirmMessage)) {
                const lotteryEntries = getLotteryEntries();

                const newEntry = {
                    id: Date.now(),
                    numbers: sortedNumbers,
                    maxRange: currentMaxNumber,
                    numPicks: currentNumPicks,
                    date: new Date().toLocaleString()
                };
                lotteryEntries.push(newEntry);
                saveLotteryEntries(lotteryEntries);

                selectedNumbers.clear();
                updateUI();

                window.location.href = 'result.html';
            } else {
                alert('응모가 취소되었습니다.');
            }
        } else {
            alert(`번호를 ${currentNumPicks}개 선택해 주세요.`);
        }
    });

    // 상단에 위치한 "응모 결과 보기" 버튼 클릭 시 이벤트 리스너
    viewResultsBtn.addEventListener('click', () => {
        window.location.href = 'result.html'; // 결과 페이지로 이동
    });

    // 새로 추가된 "응모 결과 보기" 버튼 클릭 시 이벤트 리스너
    viewResultsBtn.addEventListener('click', () => {
        window.location.href = 'result.html'; // 결과 페이지로 이동
    });

    // 번호 범위 슬라이더 값 변경 이벤트 리스너
    maxNumberRangeInput.addEventListener('input', () => {
        currentMaxNumber = parseInt(maxNumberRangeInput.value);
        currentMaxNumberSpan.textContent = `1 - ${currentMaxNumber}`;
        selectedNumbers.clear(); // 범위가 바뀌면 선택 초기화
        createNumberButtons();
        updateUI();
    });

    // 뽑을 개수 슬라이더 값 변경 이벤트 리스너
    numPicksRangeInput.addEventListener('input', () => {
        currentNumPicks = parseInt(numPicksRangeInput.value);
        currentNumPicksSpan.textContent = `${currentNumPicks}개`;

        if (selectedNumbers.size > currentNumPicks) {
            const tempArray = Array.from(selectedNumbers).slice(0, currentNumPicks);
            selectedNumbers = new Set(tempArray);
        }
        updateUI();
    });

    // 초기화
    createNumberButtons();
    updateUI();
});