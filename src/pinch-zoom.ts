/**
 * Copyright (c) 2025 Yohan Kim (yohanpro@yohanpro.com)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

interface Options {
  bindToWrapper?: any;
  disableTouch?: any;
  zoom?: boolean;
  zoomMin?: number;
  zoomMax?: number;
  startZoom?: number;
  startX?: number;
  startY?: number;
  scrollX?: boolean;
  scrollY?: boolean;
  directionLockThreshold?: number; // 스크롤 방향 잠금 임계값(픽셀)
  momentum?: boolean;
  bounce?: boolean;
  bounceTime?: number;
  bounceEasing?: string;
  preventDefault?: boolean;
  preventDefaultException?: { tagName: RegExp };
  HWCompositing?: boolean;
  useTransition?: boolean;
  useTransform?: boolean;
  useFixHeight?: boolean;
  useWindowScroll?: boolean;
  fixHeightValue?: number;
  disablePointer?: boolean;
  eventPassthrough?: boolean | string; // 이벤트 전달 방향 설정 (vertical, horizontal)
  freeScroll?: boolean; // 수직 또는 수평 스크롤을 동시에 사용할 수 있도록 설정
  resizePolling?: number; // 리사이징 감지 주기
  shrinkScrollbars?: 'scale' | 'clip'; // 스크롤바 크기 조절 방식
  tap?: boolean | 'tap'; // tap 이벤트 활성화
  click?: boolean; // click 이벤트 활성화
  deceleration?: number; // 감속률 (momentum 스크롤 계산에 사용)
  wheelAction?: 'zoom' | 'scroll'; // 마우스 휠 동작 설정
}

export class PinchZoom {
  options: Options;
  wrapper: HTMLElement;
  scroller: HTMLElement | null = null; // 스크롤러 엘리먼트
  scrollerStyle: CSSStyleDeclaration | null = null; // 스크롤러 스타일
  utils = PinchZoomUtils;
  translateZ: string;
  x: number;
  y: number;
  directionX: number;
  directionY: number;
  _events: Record<string, ((...args: any[]) => void)[]> = {};
  bZoomAction: boolean;
  scale: number;
  beforeScale: any;
  elCurrent: HTMLElement | null = null; // 초기값은 null
  bZoomStart: boolean;
  bZoomEnd: boolean;
  clientY: number;

  maxScrollX: number = 0;
  maxScrollY: number = 0;
  touchesDistanceStart: number = 0; // 두 터치 포인트 사이의 초기 거리
  startScale: number = 1; // 줌 시작 시 스케일
  originX: number = 0; // 줌 중심 X 좌표
  originY: number = 0; // 줌 중심 Y 좌표
  enabled: boolean = false;
  isInTransition: boolean = false;
  initiated: number | null = null; // 이벤트 타입 (1, 2, 3) 또는 null
  moved: boolean = false; // 사용자가 움직였는지 여부
  distX: number = 0; // X 방향 이동 거리
  distY: number = 0; // Y 방향 이동 거리
  directionLocked: 'h' | 'v' | 'n' | 0 = 0; // 방향 잠금 상태 ('h': 수평, 'v': 수직, 'n': 잠금 없음)
  startTime: number = 0; // 이벤트 시작 시간
  isAnimating: boolean = false; // 애니메이션 진행 여부
  startX: number = 0; // 시작 시점의 X 위치
  startY: number = 0; // 시작 시점의 Y 위치
  absStartX: number = 0; // 절대 시작 X 위치
  absStartY: number = 0; // 절대 시작 Y 위치
  pointX: number = 0; // 현재 X 터치/포인트 위치
  pointY: number = 0; // 현재 Y 터치/포인트 위치
  isUp: boolean = false; // 사용자가 상단 방향으로 스크롤했는지 여부
  startPointY: number = 0; // 터치 시작 Y 좌표 (추가)
  scrollerWidth: number = 0; // 스크롤러의 너비
  scrollerHeight: number = 0; // 스크롤러의 높이
  hasHorizontalScroll: boolean = false; // 수평 스크롤 가능 여부
  hasVerticalScroll: boolean = false; // 수직 스크롤 가능 여부
  wrapperWidth: number = 0; // Wrapper의 너비
  wrapperHeight: number = 0; // Wrapper의 높이
  wrapperOffset: any;
  endTime: number = 0; // 이벤트 종료 시간
  resizeTimeout: number | null = null; // 리사이즈 타이머
  scaled?: boolean; // 줌 여부

  constructor(el: HTMLElement, options: Options = {}) {
    const innerH = window.innerHeight || document.body.clientHeight;
    this.options = {
      zoom: true,
      zoomMin: 1,
      zoomMax: 3,
      startZoom: 1,
      startX: 0,
      startY: 0,
      scrollX: true,
      scrollY: true,
      directionLockThreshold: 5,
      momentum: true,
      bounce: false,
      bounceTime: 600,
      bounceEasing: '',
      preventDefault: true,
      preventDefaultException: { tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/ },
      HWCompositing: true,
      useTransition: true,
      useTransform: true,
      useFixHeight: false,
      useWindowScroll: true,
      fixHeightValue: innerH,
      disablePointer: true,
      deceleration: 0.0006,
      bindToWrapper: true,
    };

    this.options = { ...this.options, ...options };

    if (typeof el === 'string') {
      const element = document.querySelector(el);
      if (!element) {
        throw new Error(`Element not found: ${el}`);
      }
      this.wrapper = element as HTMLElement;
    } else {
      this.wrapper = el;
    }

    for (let i = 0; i < this.wrapper.children.length; i++) {
      if (this.wrapper.children[i].tagName === 'SCRIPT') {
        continue;
      }
      this.scroller = this.wrapper.children[i] as HTMLElement;
      break; // 첫 번째 적합한 자식을 스크롤러로 설정
    }

    // 스크롤러 스타일 설정
    if (this.scroller) {
      this.scrollerStyle = this.scroller.style;
    }

    this.wrapper.style.overflow = 'hidden';

    if (this.options['useFixHeight']) {
      this.wrapper.style.height = `${this.options['fixHeightValue']}px`;
    }

    // 3D 변환 사용 여부 설정
    // 즉, 하드웨어 가속 여부를 활성화 할지 정하는 것.
    this.translateZ =
      this.options.HWCompositing && this.utils.hasPerspective
        ? ' translateZ(0)'
        : '';

    this.options.useTransition =
      this.utils.hasTransition && this.options.useTransition;

    this.options.useTransform =
      this.utils.hasTransform && this.options.useTransform;

    // 터치이벤트가 수직 또는 수평으로만 전달되도록 설정하는 옵션
    this.options.eventPassthrough =
      this.options.eventPassthrough === true
        ? 'vertical'
        : this.options.eventPassthrough;

    this.options.preventDefault =
      !this.options.eventPassthrough && this.options.preventDefault;

    this.options.scrollY =
      this.options.eventPassthrough === 'vertical'
        ? false
        : this.options.scrollY;

    this.options.scrollX =
      this.options.eventPassthrough == 'horizontal'
        ? false
        : this.options.scrollX;

    // freeScroll 옵션 설정
    this.options.freeScroll =
      this.options.freeScroll && !this.options.eventPassthrough;

    this.options.directionLockThreshold = this.options.eventPassthrough
      ? 0
      : this.options.directionLockThreshold;

    // @ts-expect-error
    this.options.bounceEasing =
      typeof this.options.bounceEasing === 'string'
        ? this.utils.ease[this.options.bounceEasing] || this.utils.ease.circular
        : this.options.bounceEasing;

    this.options.resizePolling = this.options.resizePolling || 60;

    if (this.options.tap) this.options.tap = 'tap';
    if (this.options.shrinkScrollbars == 'scale') {
      this.options.useTransition = false;
    }

    this.x = 0;
    this.y = 0;
    this.directionX = 0;
    this.directionY = 0;
    this._events = {};
    this.bZoomAction = false;
    this.scale = Math.min(
      Math.max(
        this.options.startZoom as number,
        this.options.zoomMin as number,
      ),
      this.options.zoomMax as number,
    );
    this.beforeScale = this.scale;
    this._init();
    this.refresh();
    // @ts-expect-error
    this.scrollTo(this.options.startX, this.options.startY, 0, 0);
    this.enable();

    this.elCurrent = null;

    this.bZoomStart = false;
    this.bZoomEnd = false;
    this.clientY = 0;
  }
  private _init() {
    this._initEvents();

    if (this.options.zoom) {
      this._initZoom();
    }
  }
  private _transitionEnd(e: Event): void {
    if (!(e instanceof TransitionEvent)) {
      return; // TransitionEvent가 아닌 경우 처리하지 않음
    }
    if (e.target !== this.scroller || !this.isInTransition) {
      return;
    }

    this._transitionTime(0); // Reset transition time

    // If resetPosition does not trigger a reset, finalize the transition
    if (!this.resetPosition(this.options.bounceTime || 0)) {
      this.isInTransition = false;
      this._execEvent('scrollEnd');
    }
  }

  private _start(e: TouchEvent | MouseEvent): void {
    // 이벤트 타입을 확인하고, 마우스 이벤트의 경우 좌클릭만 처리
    if (this.utils.eventType[e.type] !== 1) {
      if ('button' in e && e.button !== 0) {
        return;
      }
    }

    // 인스턴스가 활성화되어 있지 않거나, 다른 이벤트로 이미 초기화된 경우 처리 중단
    if (
      !this.enabled ||
      (this.initiated && this.utils.eventType[e.type] !== this.initiated)
    ) {
      return;
    }

    // 줌 동작이 활성화된 경우 기본 동작 방지
    if (this.bZoomAction) {
      e.preventDefault();
    }

    // 이벤트에 따라 터치 포인트 또는 마우스 포인트를 가져옴
    const point = (e as TouchEvent).touches
      ? (e as TouchEvent).touches[0]
      : (e as MouseEvent);

    // 이동 및 방향 초기화
    this.initiated = this.utils.eventType[e.type];
    this.moved = false;
    this.distX = 0;
    this.distY = 0;
    this.directionX = 0;
    this.directionY = 0;
    this.directionLocked = 0;

    // 트랜지션 시간 초기화
    this._transitionTime(0);

    // 시작 시간 기록
    this.startTime = this.utils.getTime();

    // 트랜지션이 진행 중인 경우 처리
    if (this.options.useTransition && this.isInTransition) {
      this.isInTransition = false;
      const pos = this.getComputedPosition();
      this._translate(Math.round(pos.x), Math.round(pos.y));
      this._execEvent('scrollEnd'); // 스크롤 종료 이벤트 실행
    } else if (!this.options.useTransition && this.isAnimating) {
      this.isAnimating = false;
      this._execEvent('scrollEnd'); // 스크롤 종료 이벤트 실행
    }

    // 시작 위치 설정
    this.startX = this.x;
    this.startY = this.y;
    this.absStartX = this.x;
    this.absStartY = this.y;
    this.pointX = point.pageX;
    this.pointY = point.pageY;
    this.clientY = point.clientY;

    // 터치 시작 Y 좌표 저장
    this.startPointY = point.pageY;
    this.isUp = false;

    // 스크롤 시작 전 이벤트 실행
    this._execEvent('beforeScrollStart');
  }

  private _move(e: TouchEvent | MouseEvent): void {
    // 이벤트가 활성화되지 않았거나 이벤트 타입이 초기화된 이벤트와 다를 경우 처리 중단
    if (!this.enabled || this.utils.eventType[e.type] !== this.initiated) {
      return;
    }

    // 이벤트 포인트 가져오기 (터치 또는 마우스 이벤트 구분)
    const point = (e as TouchEvent).touches
      ? (e as TouchEvent).touches[0]
      : (e as MouseEvent);
    let deltaX = point.pageX - this.pointX;
    let deltaY = point.pageY - this.pointY;
    const timestamp = this.utils.getTime();

    let newX: number;
    let newY: number;

    // 현재 포인트 위치 업데이트
    this.pointX = point.pageX;
    this.pointY = point.pageY;

    // 이동 거리 계산
    this.distX += deltaX;
    this.distY += deltaY;
    const absDistX = Math.abs(this.distX);
    const absDistY = Math.abs(this.distY);

    // 방향 잠금 설정
    if (!this.directionLocked && !this.options.freeScroll) {
      if (absDistX > absDistY + this.options.directionLockThreshold!) {
        this.directionLocked = 'h';
      } else if (absDistY >= absDistX + this.options.directionLockThreshold!) {
        this.directionLocked = 'v';
      } else {
        this.directionLocked = 'n';
      }
    }

    // 방향 잠금에 따른 처리
    if (this.directionLocked === 'h') {
      if (this.options.eventPassthrough === 'vertical') {
        e.preventDefault();
      } else if (this.options.eventPassthrough === 'horizontal') {
        this.initiated = null;
        return;
      }
      deltaY = 0;
    } else if (this.directionLocked === 'v') {
      if (this.options.eventPassthrough === 'horizontal') {
        e.preventDefault();
      } else if (this.options.eventPassthrough === 'vertical') {
        this.initiated = null;
        return;
      }
      deltaX = 0;
    }

    // 스크롤 가능 여부에 따라 이동 제한
    deltaX = this.hasHorizontalScroll ? deltaX : 0;
    deltaY = this.hasVerticalScroll ? deltaY : 0;

    newX = this.x + deltaX;
    newY = this.y + deltaY;

    // 바운스 처리
    if (newX > 0 || newX < this.maxScrollX) {
      newX = this.options.bounce
        ? this.x + deltaX / 3
        : newX > 0
        ? 0
        : this.maxScrollX;
    }
    if (newY > 0 || newY < this.maxScrollY) {
      newY = this.options.bounce
        ? this.y + deltaY / 3
        : newY > 0
        ? 0
        : this.maxScrollY;
    }

    // 방향 업데이트
    this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
    this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

    // 스크롤 시작 이벤트 실행
    if (!this.moved) {
      this._execEvent('scrollStart');
    }

    this.moved = true;

    // 상단 스크롤 방향 확인
    this.isUp = Math.abs(newY) > Math.abs(this.y);
    if (this.options.useWindowScroll && this.x === newX) {
      if (
        (this.isUp &&
          Math.abs(this.wrapperOffset.top) > document.body.scrollTop) ||
        (!this.isUp &&
          Math.abs(this.wrapperOffset.top) + this.wrapperHeight <
            document.body.scrollTop +
              (window.innerHeight || document.body.clientHeight))
      ) {
        return;
      }
    }

    // 스크롤 이동
    if (this.x !== newX || this.y !== newY) {
      e.preventDefault();
    }

    this._translate(newX, newY);

    // 시간 갱신 및 시작 위치 업데이트
    if (timestamp - this.startTime > 300) {
      this.startTime = timestamp;
      this.startX = this.x;
      this.startY = this.y;
    }
  }

  private _end(e: TouchEvent | MouseEvent): void {
    if (!this.enabled || this.utils.eventType[e.type] !== this.initiated) {
      return;
    }

    if (
      this.options.preventDefault &&
      !this.utils.preventDefaultException(
        e.target as HTMLElement,
        this.options.preventDefaultException!,
      )
    ) {
      e.preventDefault();
    }

    this.isInTransition = false;
    this.initiated = 0;
    this.endTime = this.utils.getTime();

    if (this.resetPosition(this.options.bounceTime || 0)) {
      return;
    }

    if (!this.moved) {
      if (this.options.tap) {
        this.utils.tap(
          e as TouchEvent | MouseEvent,
          this.options.tap as string,
        );
      }

      if (this.options.click) {
        this.utils.click(e);
      }

      this._execEvent('scrollCancel');
      return;
    }

    // 모멘텀 스크롤 동작
    // 사용자가 터치/드래그를 멈춘 이후에도 관성 효과로 인해 스크롤이 자연스럽게 감속하며 종료
    if (this.options.momentum) {
      const duration = this.utils.getTime() - this.startTime;
      const momentumX = this.hasHorizontalScroll
        ? this.utils.momentum(
            this.x,
            this.startX,
            duration,
            this.maxScrollX,
            this.options.bounce ? this.wrapperWidth : 0,
            this.options.deceleration,
          )
        : { destination: this.x, duration: 0 };

      const momentumY = this.hasVerticalScroll
        ? this.utils.momentum(
            this.y,
            this.startY,
            duration,
            this.maxScrollY,
            this.options.bounce ? this.wrapperHeight : 0,
            this.options.deceleration,
          )
        : { destination: this.y, duration: 0 };

      const newX = momentumX.destination;
      const newY = momentumY.destination;
      const time = Math.max(momentumX.duration, momentumY.duration);

      this.scrollTo(newX, newY, time);

      return;
    }

    this._execEvent('scrollEnd');
  }
  private _resize(): void {
    // 기존 예약된 타임아웃을 취소하여 불필요한 호출 방지
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    // resizePolling 값만큼의 딜레이 후 refresh 실행
    this.resizeTimeout = setTimeout(() => {
      this.refresh();
    }, this.options.resizePolling || 60) as unknown as number;
  }

  /**
   * 스크롤러의 위치를 초기화하거나 최대/최소 경계를 초과하지 않도록 조정
   * @param time 애니메이션 시간 (기본값: 0)
   * @returns 위치가 조정되었는지 여부
   */
  resetPosition(time: number = 0): boolean {
    let x = this.x; // 현재 X 좌표
    let y = this.y; // 현재 Y 좌표

    // X 좌표를 경계 값으로 조정
    if (!this.hasHorizontalScroll || this.x > 0) {
      x = 0; // 왼쪽 경계를 초과한 경우
    } else if (this.x < this.maxScrollX) {
      x = this.maxScrollX; // 오른쪽 경계를 초과한 경우
    }

    // Y 좌표를 경계 값으로 조정
    if (!this.hasVerticalScroll || this.y > 0) {
      y = 0; // 상단 경계를 초과한 경우
    } else if (this.y < this.maxScrollY) {
      y = this.maxScrollY; // 하단 경계를 초과한 경우
    }

    // 현재 위치가 조정된 위치와 동일하면 false 반환
    if (x === this.x && y === this.y) {
      return false;
    }

    // 새로운 위치로 스크롤
    this.scrollTo(x, y, time, this.options.bounceEasing);

    return true; // 위치가 조정되었음을 나타냄
  }

  disable() {
    this.enabled = false;
  }
  enable() {
    this.enabled = true;
  }

  /**
   * 레이아웃 및 스크롤 가능한 영역을 갱신
   * @param nScale 새로운 스케일 값 (기본값: 현재 스케일)
   */
  refresh(nScale?: number): void {
    // 스케일 갱신 (nScale이 제공되지 않으면 현재 스케일 유지)
    this.scale = nScale ?? this.scale;

    // 래퍼 및 스크롤러 크기 계산
    this.wrapperWidth = this.wrapper.clientWidth;
    this.wrapperHeight = this.wrapper.clientHeight;

    this.scrollerWidth = Math.round(
      (this.scroller?.offsetWidth || 0) * this.scale,
    );
    this.scrollerHeight = Math.round(
      (this.scroller?.offsetHeight || 0) * this.scale,
    );

    // 최대 스크롤 값 계산
    this.maxScrollX = this.wrapperWidth - this.scrollerWidth;
    this.maxScrollY = this.wrapperHeight - this.scrollerHeight;

    // 수평 및 수직 스크롤 가능 여부 계산
    this.hasHorizontalScroll = !!this.options.scrollX && this.maxScrollX < 0;
    this.hasVerticalScroll = !!this.options.scrollY && this.maxScrollY < 0;

    // 수평 스크롤이 불가능한 경우 초기화
    if (!this.hasHorizontalScroll) {
      this.maxScrollX = 0;
      this.scrollerWidth = this.wrapperWidth;
    }

    // 수직 스크롤이 불가능한 경우 초기화
    if (!this.hasVerticalScroll) {
      this.maxScrollY = 0;
      this.scrollerHeight = this.wrapperHeight;
    }

    // 기타 상태 초기화
    this.endTime = 0;
    this.directionX = 0;
    this.directionY = 0;

    // 래퍼 오프셋 갱신
    this.wrapperOffset = this.utils.offset(this.wrapper);

    // 'refresh' 이벤트 실행
    this._execEvent('refresh');

    // 위치를 초기화하여 스크롤러가 올바른 위치에 있도록 보장
    this.resetPosition();
  }
  on(type: string, fn: (...args: any[]) => void): void {
    // 이벤트 타입이 존재하지 않으면 초기화
    if (!this._events[type]) {
      this._events[type] = [];
    }

    // 해당 이벤트 타입에 함수 추가
    this._events[type].push(fn);
  }

  off(type: string, fn: (...args: any[]) => void): void {
    // 이벤트 타입이 존재하지 않으면 바로 반환
    if (!this._events[type]) {
      return;
    }

    // 해당 이벤트 타입의 함수 배열에서 인덱스 찾기
    const index = this._events[type].indexOf(fn);

    // 인덱스를 기반으로 함수 제거
    if (index > -1) {
      this._events[type].splice(index, 1);
    }
  }
  private _execEvent(type: string, ...args: any[]) {
    if (!this._events[type]) {
      return;
    }
    const events = this._events[type];

    if (!events || events.length === 0) {
      return;
    }

    for (let i = 0; i < events.length; i++) {
      events[i].apply(this, args);
    }
  }
  scrollBy(x: number, y: number, time: number, easing: string) {
    x = this.x + x;
    y = this.y + y;
    time = time || 0;

    this.scrollTo(x, y, time, easing);
  }
  scrollTo(x: number, y: number, time?: number, easing?: any) {
    easing = easing || this.utils.ease.circular;
    // @ts-expect-error
    this.isInTransition = this.options.useTransition && time > 0;
    if (!time || (this.options.useTransition && easing.style)) {
      this._transitionTimingFunction(easing.style);
      this._transitionTime(time);
      this._translate(x, y);
    } else {
      this._animate(x, y, time, easing.fn);
    }
  }

  scrollToElement(
    el: HTMLElement | string,
    time?: number | 'auto',
    offsetX?: boolean | number,
    offsetY?: boolean | number,
    easing?: string,
  ): void {
    const element =
      typeof el === 'string' ? this.scroller?.querySelector(el) : el;

    if (!element) {
      return;
    }

    const pos = this.utils.offset(element as HTMLElement);

    pos.left -= this.wrapperOffset.left;
    pos.top -= this.wrapperOffset.top;

    if (offsetX === true) {
      offsetX = Math.round(
        (element as HTMLElement).offsetWidth / 2 - this.wrapper.offsetWidth / 2,
      );
    }
    if (offsetY === true) {
      offsetY = Math.round(
        (element as HTMLElement).offsetHeight / 2 -
          this.wrapper.offsetHeight / 2,
      );
    }

    pos.left -= offsetX || 0;
    pos.top -= offsetY || 0;

    pos.left =
      pos.left > 0
        ? 0
        : pos.left < this.maxScrollX
        ? this.maxScrollX
        : pos.left;
    pos.top =
      pos.top > 0 ? 0 : pos.top < this.maxScrollY ? this.maxScrollY : pos.top;

    if (time === undefined || time === null || time === 'auto') {
      time = Math.max(Math.abs(this.x - pos.left), Math.abs(this.y - pos.top));
    }

    this.scrollTo(pos.left, pos.top, time as number, easing);
  }
  private _transitionTime = (time?: number) => {
    time = time || 0;
    this.scrollerStyle![this.utils.style.transitionDuration] = time + 'ms';

    if (!time && this.utils.isBadAndroid) {
      this.scrollerStyle![this.utils.style.transitionDuration] = '0.001s';
    }
  };
  private _transitionTimingFunction = (easing: string) => {
    this.scrollerStyle![this.utils.style.transitionTimingFunction] = easing;
  };

  private _translate(x: number, y: number): void {
    if (this.options.useTransform) {
      if (
        ((!this.bZoomStart && this.beforeScale > 1) ||
          (this.bZoomStart && this.bZoomEnd)) &&
        this.scale === 1 &&
        this.beforeScale !== this.scale &&
        this.elCurrent !== null
      ) {
        const elOffset = this.utils.offset(this.elCurrent as HTMLElement);
        const nY = Math.abs(elOffset.top);

        const isCenter = true;
        const nCurrentY = isCenter
          ? nY -
            ((window.innerHeight || document.body.clientHeight) / 2 -
              (this.elCurrent as HTMLElement).offsetHeight / 2)
          : nY;

        window.scrollTo(0, nCurrentY);
        this.bZoomStart = false;
        this.bZoomEnd = false;
      }
      this.beforeScale = this.scale;
      if (this.scrollerStyle) {
        this.scrollerStyle[
          this.utils.style.transform as any
        ] = `translate(${x}px, ${y}px) scale(${this.scale}) ${this.translateZ}`;
      }
    } else {
      x = Math.round(x);
      y = Math.round(y);
      if (this.scrollerStyle) {
        this.scrollerStyle.left = `${x}px`;
        this.scrollerStyle.top = `${y}px`;
      }
    }

    this.x = x;
    this.y = y;
  }

  private _initEvents(remove: boolean = false): void {
    const eventType = remove ? this.utils.removeEvent : this.utils.addEvent;
    const target = this.wrapper;

    // Pointer events
    if (this.utils.hasPointer && !this.options.disablePointer) {
      eventType(
        this.wrapper,
        this.utils.prefixPointerEvent('down'),
        this.handleEvent.bind(this),
      );
      eventType(
        target,
        this.utils.prefixPointerEvent('move'),
        this.handleEvent.bind(this),
      );
      eventType(
        target,
        this.utils.prefixPointerEvent('cancel'),
        this.handleEvent.bind(this),
      );
      eventType(
        target,
        this.utils.prefixPointerEvent('up'),
        this.handleEvent.bind(this),
      );
    }

    // Touch events
    if (this.utils.hasTouch && !this.options.disableTouch) {
      eventType(this.wrapper, 'touchstart', this.handleEvent.bind(this));
      eventType(target, 'touchmove', this.handleEvent.bind(this));
      eventType(target, 'touchcancel', this.handleEvent.bind(this));
      eventType(target, 'touchend', this.handleEvent.bind(this));
    }

    // Transition events
    const transitions = [
      'transitionend',
      'webkitTransitionEnd',
      'oTransitionEnd',
      'MSTransitionEnd',
    ];

    transitions.forEach(transition => {
      eventType(
        this.scroller as HTMLElement,
        transition,
        this.handleEvent.bind(this),
      );
    });
  }
  isZoomUp() {
    return this.scale > 1;
  }
  getComputedPosition(): { x: number; y: number } {
    if (!this.scroller) {
      throw new Error('Scroller element가 존재하지 않습니다.');
    }

    const style = window.getComputedStyle(this.scroller);
    let x: number = 0;
    let y: number = 0;

    if (this.options.useTransform && this.utils.style.transform) {
      const transform = style[this.utils.style.transform as any];
      if (transform && transform !== 'none') {
        const matrix = transform.split(')')[0].split(', ');
        x = +(matrix[12] || matrix[4]) || 0;
        y = +(matrix[13] || matrix[5]) || 0;
      }
    } else {
      x = parseFloat(style.left || '0');
      y = parseFloat(style.top || '0');
    }

    return { x, y };
  }

  private _initZoom() {
    this.scrollerStyle![this.utils.style.transformOrigin] = '0 0';
  }
  private _zoomStart(e: TouchEvent): void {
    if (!e.touches || e.touches.length < 2) {
      throw new Error('Zoom을 위한 터치가 2개 이상 필요합니다.');
    }

    const c1 = Math.abs(e.touches[0].pageX - e.touches[1].pageX);
    const c2 = Math.abs(e.touches[0].pageY - e.touches[1].pageY);

    this.touchesDistanceStart = Math.sqrt(c1 * c1 + c2 * c2);
    this.startScale = this.scale;

    this.originX =
      (e.touches[0].pageX + e.touches[1].pageX) / 2 +
      this.wrapperOffset.left -
      this.x;
    this.originY =
      (e.touches[0].pageY + e.touches[1].pageY) / 2 +
      this.wrapperOffset.top -
      this.y;

    this._execEvent('zoomStart');
  }

  private _zoom(e: TouchEvent): void {
    if (!this.enabled || PinchZoomUtils.eventType[e.type] !== this.initiated) {
      return;
    }

    if (this.options.preventDefault) {
      e.preventDefault();
    }

    // 두 점 사이의 거리를 계산
    const c1 = Math.abs(e.touches[0].pageX - e.touches[1].pageX);
    const c2 = Math.abs(e.touches[0].pageY - e.touches[1].pageY);
    const distance = Math.sqrt(c1 * c1 + c2 * c2);

    let scale = (1 / this.touchesDistanceStart) * distance * this.startScale;

    this.scaled = true;

    if (scale < this.options.zoomMin!) {
      scale =
        0.5 *
        this.options.zoomMin! *
        Math.pow(2.0, scale / this.options.zoomMin!);
    } else if (scale > this.options.zoomMax!) {
      scale =
        2.0 *
        this.options.zoomMax! *
        Math.pow(0.5, this.options.zoomMax! / scale);
    }

    const lastScale = scale / this.startScale;
    const x = this.originX - this.originX * lastScale + this.startX;
    const y = this.originY - this.originY * lastScale + this.startY;

    this.scale = scale;
    this.scrollTo(x, y, 0);
  }
  private _zoomEnd(e: TouchEvent): void {
    // 활성화되지 않았거나 이벤트가 현재 상태와 일치하지 않으면 중단
    if (!this.enabled || this.utils.eventType[e.type] !== this.initiated) {
      return;
    }

    let newX: number;
    let newY: number;

    // 상태 초기화
    this.isInTransition = false;
    this.initiated = 0;

    // 줌 비율 클램핑
    if (this.scale > (this.options.zoomMax || 3)) {
      this.scale = this.options.zoomMax || 3;
    } else if (this.scale < (this.options.zoomMin || 1)) {
      this.scale = this.options.zoomMin || 1;
    }

    // 스크롤 영역과 관련된 정보를 새로고침
    this.refresh();

    // 스케일 계산
    const lastScale = this.scale / this.startScale;

    // 새 좌표 계산
    newX = this.originX - this.originX * lastScale + this.startX;
    newY = this.originY - this.originY * lastScale + this.startY;

    // 좌표 클램핑
    if (newX > 0) {
      newX = 0;
    } else if (newX < this.maxScrollX) {
      newX = this.maxScrollX;
    }

    if (newY > 0) {
      newY = 0;
    } else if (newY < this.maxScrollY) {
      newY = this.maxScrollY;
    }

    // 새로운 위치로 이동
    if (this.x !== newX || this.y !== newY) {
      this.scrollTo(newX, newY, this.options.bounceTime || 0);
    }

    // 줌 상태 종료
    this.scaled = false;

    // `zoomEnd` 이벤트 실행
    this._execEvent('zoomEnd');
  }
  zoom(scale: number, x?: number, y?: number, time?: number): void {
    // 스케일을 최소 및 최대값으로 제한
    if (scale < (this.options.zoomMin || 1)) {
      scale = this.options.zoomMin || 1;
    } else if (scale > (this.options.zoomMax || 3)) {
      scale = this.options.zoomMax || 3;
    }

    // 현재 스케일과 동일하면 처리 중단
    if (scale === this.scale) {
      return;
    }

    // 상대 스케일 계산
    const relScale = scale / this.scale;

    // x, y 좌표 기본값 설정
    x = x === undefined ? this.wrapperWidth / 2 : x;
    y = y === undefined ? this.wrapperHeight / 2 : y;
    time = time === undefined ? 300 : time;

    // 새로운 x, y 좌표 계산
    x = x + this.wrapperOffset.left - this.x;
    y = y + this.wrapperOffset.top - this.y;
    x = x - x * relScale + this.x;
    y = y - y * relScale + this.y;

    // 새로운 스케일 적용
    this.scale = scale;

    // 스크롤 가능한 영역 업데이트
    this.refresh();

    // x, y 좌표를 가능한 범위로 제한
    if (x > 0) {
      x = 0;
    } else if (x < this.maxScrollX) {
      x = this.maxScrollX;
    }

    if (y > 0) {
      y = 0;
    } else if (y < this.maxScrollY) {
      y = this.maxScrollY;
    }

    // 새로운 위치로 스크롤
    this.scrollTo(x, y, time);
  }

  private _animate(
    destX: number,
    destY: number,
    duration: number,
    easingFn: (time: number) => number,
  ): void {
    const startX = this.x;
    const startY = this.y;
    const startTime = this.utils.getTime();
    const destTime = startTime + duration;

    const step = () => {
      const now = this.utils.getTime();

      if (now >= destTime) {
        this.isAnimating = false;
        this._translate(destX, destY);

        if (!this.resetPosition(this.options.bounceTime)) {
          this._execEvent('scrollEnd');
        }

        return;
      }

      const progress = (now - startTime) / duration;
      const easing = easingFn(progress);
      const newX = (destX - startX) * easing + startX;
      const newY = (destY - startY) * easing + startY;
      this._translate(newX, newY);

      if (this.isAnimating) {
        requestAnimationFrame(step);
      }
    };

    this.isAnimating = true;
    step();
  }

  private handleEvent(e: Event): void {
    switch (e.type) {
      case 'touchstart':
      case 'pointerdown':
      case 'MSPointerDown':
      case 'mousedown':
        this.elCurrent = e.target as HTMLElement;
        this.bZoomStart = false;
        this.bZoomEnd = false;
        this.bZoomAction =
          // @ts-expect-error
          !!this.options.zoom && 'touches' in e && e.touches.length > 1;
        this._start(e as TouchEvent);
        // @ts-expect-error
        if (this.options.zoom && 'touches' in e && e.touches.length > 1) {
          this.bZoomStart = true;
          this._zoomStart(e as TouchEvent);
        }
        break;

      case 'touchmove':
      case 'pointermove':
      case 'MSPointerMove':
      case 'mousemove':
        // @ts-expect-error
        if (this.options.zoom && 'touches' in e && e.touches[1]) {
          this.bZoomStart = true;
          this._zoom(e as TouchEvent);
          return;
        }
        this._move(e as MouseEvent | TouchEvent);
        break;

      case 'touchend':
      case 'pointerup':
      case 'MSPointerUp':
      case 'mouseup':
      case 'touchcancel':
      case 'pointercancel':
      case 'MSPointerCancel':
      case 'mousecancel':
        if (this.scaled) {
          this.bZoomStart = true;
          this.bZoomEnd = true;
          this._zoomEnd(e as TouchEvent);
          return;
        }
        this._end(e as MouseEvent | TouchEvent);
        break;

      case 'orientationchange':
      case 'resize':
        this._resize();
        break;

      case 'transitionend':
      case 'webkitTransitionEnd':
      case 'oTransitionEnd':
      case 'MSTransitionEnd':
        this._transitionEnd(e);
        break;
    }
  }
}

class PinchZoomUtils {
  /**
   * DOM 요소 스타일을 위한 임시 엘리먼트
   */
  private static _elementStyle = document.createElement('div').style;

  private static _vendor = (function () {
    const vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'] as const;
    for (const v of vendors) {
      const transform = v + 'ransform'; // t + ransform = transform, webkitTransform, ...
      if (transform in PinchZoomUtils._elementStyle) {
        // 예: 'webkitT' -> 'webkit'
        return v.slice(0, -1);
      }
    }
    // 지원 안 하면 빈 문자열
    return '';
  })();

  /**
   * 벤더 접두사를 포함하여 CSS 속성 이름을 반환
   * 구형 코드에서는 지원하지 않으면 false를 반환했지만,
   * 여기서는 기본적으로 string을 반환하거나, 접두사가 없으면 그대로 반환.
   */
  private static _prefixStyle(style: string): string {
    if (!PinchZoomUtils._vendor) {
      // 벤더 접두사가 없는 경우: 그대로 반환
      return style;
    }
    // 접두사가 있는 경우: webkit + Transform 같은 식으로 변환
    return (
      PinchZoomUtils._vendor + style.charAt(0).toUpperCase() + style.slice(1)
    );
  }

  /**
   * transform 속성 이름 (접두사가 포함된 형태)
   *  - 예: webkitTransform / MozTransform / transform ...
   */
  static transform: string = PinchZoomUtils._prefixStyle('transform');

  /**
   * 현재 시간(밀리초) 반환
   */
  static getTime(): number {
    // (구형 코드에서 Date.now가 없을 경우 new Date().getTime() 사용)
    return Date.now ? Date.now() : new Date().getTime();
  }

  /**
   * target에 obj 속성을 병합
   */
  static extend(target: Record<string, any>, obj: Record<string, any>): void {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        target[key] = obj[key];
      }
    }
  }

  static addEvent(
    el: HTMLElement,
    type: string,
    fn: EventListenerOrEventListenerObject,
    capture: boolean = false,
  ): void {
    el.addEventListener(type, fn, capture);
  }

  static removeEvent(
    el: HTMLElement,
    type: string,
    fn: EventListenerOrEventListenerObject,
    capture: boolean = false,
  ): void {
    el.removeEventListener(type, fn, capture);
  }

  /**
   * PointerEvent가 구형 브라우저(IE10 등)에서 MSPointerEvent로 잡힐 때 변환
   */
  static prefixPointerEvent(pointerEvent: string): string {
    // window.MSPointerEvent가 있는 환경이라면
    if ((window as any).MSPointerEvent) {
      // 예: 'pointerdown' -> 'MSPointerDown'
      return (
        'MSPointer' +
        pointerEvent.charAt(9).toUpperCase() +
        pointerEvent.slice(10)
      );
    }
    return pointerEvent;
  }

  /**
   * momentum 스크롤 계산
   */
  static momentum(
    current: number,
    start: number,
    time: number,
    lowerMargin: number,
    wrapperSize: number,
    deceleration: number = 0.0006,
  ): { destination: number; duration: number } {
    let distance = current - start;
    const speed = Math.abs(distance) / time;

    let destination: number =
      current +
      ((speed * speed) / (2 * deceleration)) * (distance < 0 ? -1 : 1);
    let duration = speed / deceleration;

    if (destination < lowerMargin) {
      destination = wrapperSize
        ? lowerMargin - (wrapperSize / 2.5) * (speed / 8)
        : lowerMargin;
      distance = Math.abs(destination - current);
      duration = distance / speed;
    } else if (destination > 0) {
      destination = wrapperSize ? (wrapperSize / 2.5) * (speed / 8) : 0;
      distance = Math.abs(current) + destination;
      duration = distance / speed;
    }

    return {
      destination: Math.round(destination),
      duration: duration,
    };
  }

  /**
   * 고유 기능 플래그들(hasTransform, hasPerspective, ...)
   */
  static hasTransform: boolean = PinchZoomUtils.transform !== 'false';
  static hasPerspective: boolean =
    PinchZoomUtils._prefixStyle('perspective') in PinchZoomUtils._elementStyle;
  static hasTouch: boolean = 'ontouchstart' in window;
  static hasPointer: boolean =
    !!(window as any).PointerEvent || !!(window as any).MSPointerEvent;
  static hasTransition: boolean =
    PinchZoomUtils._prefixStyle('transition') in PinchZoomUtils._elementStyle;

  /**
   * 안드로이드 환경 감지 (구형 코드 그대로)
   */
  static isBadAndroid: boolean =
    /Android /.test(window.navigator.userAgent) &&
    !/Chrome\/\d/.test(window.navigator.userAgent);

  /**
   * transform / transition 등의 style 키
   */
  static style = {
    transform: PinchZoomUtils.transform,
    transitionTimingFunction: PinchZoomUtils._prefixStyle(
      'transitionTimingFunction',
    ),
    transitionDuration: PinchZoomUtils._prefixStyle('transitionDuration'),
    transitionDelay: PinchZoomUtils._prefixStyle('transitionDelay'),
    transformOrigin: PinchZoomUtils._prefixStyle('transformOrigin'),
  };

  /**
   * class 유틸리티
   */
  static hasClass(el: HTMLElement, className: string): boolean {
    const re = new RegExp('(^|\\s)' + className + '(\\s|$)');
    return re.test(el.className);
  }

  static addClass(el: HTMLElement, className: string): void {
    if (PinchZoomUtils.hasClass(el, className)) return;
    const newClass = el.className.split(' ');
    newClass.push(className);
    el.className = newClass.join(' ');
  }

  static removeClass(el: HTMLElement, className: string): void {
    if (!PinchZoomUtils.hasClass(el, className)) return;
    const re = new RegExp('(^|\\s)' + className + '(\\s|$)', 'g');
    el.className = el.className.replace(re, ' ');
  }

  /**
   * offset 계산: 엘리먼트 기준 왼쪽/위쪽 계산
   */
  static offset(el: HTMLElement): { left: number; top: number } {
    let left = -el.offsetLeft;
    let top = -el.offsetTop;

    while ((el = el.offsetParent as HTMLElement)) {
      left -= el.offsetLeft;
      top -= el.offsetTop;
    }
    return { left, top };
  }

  /**
   * preventDefault 예외 처리
   */
  static preventDefaultException(
    el: HTMLElement,
    exceptions: Record<string, RegExp>,
  ): boolean {
    for (const i in exceptions) {
      if (exceptions[i].test((el as any)[i])) {
        return true;
      }
    }
    return false;
  }

  /**
   * 이벤트 타입 매핑 (touchstart -> 1, mousedown -> 2, pointerdown -> 3 등)
   */
  static eventType: Record<string, number> = {
    touchstart: 1,
    touchmove: 1,
    touchend: 1,

    mousedown: 2,
    mousemove: 2,
    mouseup: 2,

    pointerdown: 3,
    pointermove: 3,
    pointerup: 3,

    MSPointerDown: 3,
    MSPointerMove: 3,
    MSPointerUp: 3,
  };

  /**
   * ease 함수 모음 (animation timing function)
   */
  static ease: Record<string, { style: string; fn: (k: number) => number }> = {
    quadratic: {
      style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fn(k: number) {
        return k * (2 - k);
      },
    },
    circular: {
      style: 'cubic-bezier(0.1, 0.57, 0.1, 1)',
      fn(k: number) {
        return Math.sqrt(1 - --k * k);
      },
    },
    back: {
      style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      fn(k: number) {
        const b = 4;
        return (k = k - 1) * k * ((b + 1) * k + b) + 1;
      },
    },
    bounce: {
      style: '',
      fn(k: number) {
        if ((k /= 1) < 1 / 2.75) {
          return 7.5625 * k * k;
        } else if (k < 2 / 2.75) {
          return 7.5625 * (k -= 1.5 / 2.75) * k + 0.75;
        } else if (k < 2.5 / 2.75) {
          return 7.5625 * (k -= 2.25 / 2.75) * k + 0.9375;
        } else {
          return 7.5625 * (k -= 2.625 / 2.75) * k + 0.984375;
        }
      },
    },
    elastic: {
      style: '',
      fn(k: number) {
        const f = 0.22,
          e = 0.4;
        if (k === 0) return 0;
        if (k === 1) return 1;
        return (
          e *
            Math.pow(2, -10 * k) *
            Math.sin(((k - f / 4) * (2 * Math.PI)) / f) +
          1
        );
      },
    },
  };

  /**
   * tap 이벤트 디스패치
   */
  static tap(e: MouseEvent | TouchEvent | Touch, eventName: string): void {
    const ev = new CustomEvent(eventName, {
      bubbles: true,
      cancelable: true,
      detail: {
        pageX: (e as MouseEvent).pageX || (e as Touch).pageX,
        pageY: (e as MouseEvent).pageY || (e as Touch).pageY,
      },
    });
    (e.target as HTMLElement).dispatchEvent(ev);
  }

  /**
   * 클릭 이벤트 디스패치(유사 클릭 처리)
   */
  static click(e: any): void {
    const target: HTMLElement = e.target;
    // 폼 요소가 아니면 인위적으로 click 이벤트 트리거
    if (!/(SELECT|INPUT|TEXTAREA)/i.test(target.tagName)) {
      const ev = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: e.view,
        detail: 1,
        screenX: e.screenX,
        screenY: e.screenY,
        clientX: e.clientX,
        clientY: e.clientY,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        button: 0,
        relatedTarget: null,
      } as MouseEventInit);
      (ev as any)._constructed = true;
      target.dispatchEvent(ev);
    }
  }
}
if (typeof window !== 'undefined') {
  (window as any).PinchZoom = PinchZoom;
}
