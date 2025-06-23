document.addEventListener('DOMContentLoaded', () => {
    const numberGrid = document.querySelector('.number-grid');
    const autoSelectBtn = document.getElementById('autoSelectBtn');
    const submitBtn = document.getElementById('submitBtn');
    const titleHeader = document.querySelector('.header .title');

    let selectedNumbers = new Set(); // 중복을 방지하기 위해 Set 사용

    const MAX_SELECTION = 6;

    // 1부터 45까지의 숫자 버튼 생성
    function createNumberButtons() {
        for (let i = 1; i <= 45; i++) {
            const button = document.createElement('button');
            button.classList.add('number-button');
            button.textContent = i;
            button.dataset.number = i; // data-number 속성에 숫자 저장
            button.addEventListener('click', () => toggleNumberSelection(i, button));
            numberGrid.appendChild(button);
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
            if (selectedNumbers.size < MAX_SELECTION) {
                selectedNumbers.add(number);
                buttonElement.classList.add('selected');
            } else {
                alert(`번호는 ${MAX_SELECTION}개까지만 선택할 수 있습니다.`);
            }
        }
        updateUI();
    }

    // UI 업데이트 (선택된 번호 수, 제출 버튼 활성화 등)
    function updateUI() {
        if (selectedNumbers.size === MAX_SELECTION) {
            titleHeader.textContent = `번호 ${MAX_SELECTION}개 선택 완료`;
            submitBtn.disabled = false;
        } else {
            titleHeader.textContent = `번호 ${MAX_SELECTION}개를 선택해 주세요`;
            submitBtn.disabled = true;
        }
        // 자동 선택 시 모든 버튼의 selected 클래스를 제거
        document.querySelectorAll('.number-button').forEach(btn => {
            const num = parseInt(btn.dataset.number);
            if (!selectedNumbers.has(num)) {
                btn.classList.remove('selected');
            }
        });
    }

    // 자동 선택하기 로직
    autoSelectBtn.addEventListener('click', () => {
        selectedNumbers.clear(); // 기존 선택 초기화

        const allNumbers = Array.from({ length: 45 }, (_, i) => i + 1); // 1부터 45까지 배열 생성
        // 배열을 섞어서 앞에서 6개 추출 (Fisher-Yates shuffle 알고리즘)
        for (let i = allNumbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allNumbers[i], allNumbers[j]] = [allNumbers[j], allNumbers[i]];
        }

        // 섞인 배열에서 6개 선택
        for (let i = 0; i < MAX_SELECTION; i++) {
            selectedNumbers.add(allNumbers[i]);
        }

        // UI 업데이트: 모든 버튼에서 selected 클래스를 제거하고, 새로 선택된 번호에만 적용
        document.querySelectorAll('.number-button').forEach(button => {
            const number = parseInt(button.dataset.number);
            if (selectedNumbers.has(number)) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });

        updateUI();
    });

    // "이 번호로 응모하기" 버튼 클릭 시
    submitBtn.addEventListener('click', () => {
        if (selectedNumbers.size === MAX_SELECTION) {
            const sortedNumbers = Array.from(selectedNumbers).sort((a, b) => a - b);
            alert(`선택된 번호: ${sortedNumbers.join(', ')}\n이 번호로 응모합니다!`);
            // 여기에 실제 응모 로직 (예: 백엔드 API 호출) 추가
        } else {
            alert(`번호를 ${MAX_SELECTION}개 선택해 주세요.`);
        }
    });

    // 초기화
    createNumberButtons();
    updateUI(); // 초기 상태 설정
});