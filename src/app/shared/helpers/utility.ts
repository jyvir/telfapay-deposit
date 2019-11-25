import {DatePipe} from '@angular/common';
import {FormGroup} from '@angular/forms';
import {Md5} from 'ts-md5/dist/md5';

export class Utility {
  // empty checker
  static isEmpty(obj): boolean {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        return false;
      }
    }
    if (obj instanceof Date) {
      return false;
    }
    if (typeof obj === 'number') {
      return false;
    }
    return true;
  }
  // checks if date is valid
  static isValidDate(d: Date): boolean {
    return d instanceof Date && !isNaN(d as any);
  }
  // copy utility
  static copy(value) {
    value.select();
    document.execCommand('copy');
    value.setSelectionRange(0, 0);
  }
  // format date to be used in forming the search query
  static formatDate(date) {
    const pipe = new DatePipe('en-US');
    return pipe.transform(date, 'yyyy-MM-ddTHH:mm:ss');
  }
  // used to create search query using the object used
  static  searchUtility(fieldName, logic, value) {
    const pipe = new DatePipe('en-US');
    logic = 'EQ'; // temp
    if (fieldName === 'id' || fieldName === 'status' || fieldName === 'direction' ||
      fieldName === 'paymentType' || fieldName === 'isFraud') {
      logic = 'EQ';
    }
    if (fieldName.includes('fromDate') && this.isValidDate(value)) {
      fieldName = fieldName === 'fromDateUpdate' ? 'updateTime' : 'createTime';
      value = pipe.transform(value, 'yyyy-MM-dd HH:mm:ss');
      logic = 'GE';
    }
    if (fieldName.includes('toDate') && this.isValidDate(value)) {
      fieldName = fieldName === 'toDateUpdate' ? 'updateTime' : 'createTime';
      value = pipe.transform(value, 'yyyy-MM-dd HH:mm:ss');
      logic = 'LE';
    }
    /* for old balance search in bank accounts page */
    if (fieldName === 'selectTime') {
      fieldName = 'updateTime';
      value = pipe.transform(value, 'yyyy-MM-dd HH:mm:ss');
      logic = 'LE';
    }

    if (fieldName === 'fromAmount') {
      fieldName = 'amount';
      value = parseFloat(value);
      logic = 'GE';
    }
    if (fieldName === 'toAmount') {
      fieldName = 'amount';
      value = parseFloat(value);
      logic = 'LE';
    }

    if (fieldName === 'status' || fieldName === 'productId' || fieldName === 'paymentType' || fieldName === 'channel'
      || fieldName === 'paymentProviderId' || fieldName === 'player.username' || fieldName === 'bankAccount.bankId'
      || fieldName === 'bankAdjustmentStatus' || fieldName === 'bankAccount.accountNumber' || fieldName === 'productIds'
      || fieldName === 'paymentUrlType' || fieldName === 'type') {
      if (fieldName === 'channel') {
        fieldName = 'paymentConfig.channel';
      } else if (fieldName === 'paymentProviderId') {
        fieldName = 'paymentConfig.providerId';
      }
      logic = 'IN';
    }

    if (fieldName === 'hideChannel') {
      fieldName = 'paymentConfig.channel';
      logic = 'NIN';
    }
    const param = {
      fieldName,
      value,
      logic
    };
    return param;
  }
  // formats date to be used for search filter
  static formatDateFilter(data) {
    if (data.fromDate && !data.toDate) {
      if (data.toTime) {
        data.fromDate.setHours(0, 0, 0, 0);
        data.fromDate.setHours(data.toTime.getHours(), data.toTime.getMinutes());
        data.toDate = data.fromDate;
      }
      data.fromDate.setHours(0, 0, 0, 0);
      data.fromDate = data.fromTime || data.fromDate;
    } else if (!data.fromDate && data.toDate) {
      if (data.fromTime) {
        data.toDate.setHours(0, 0, 0, 0);
        data.toDate.setHours(data.fromTime.getHours(), data.fromTime.getMinutes());
        data.fromDate = data.toDate;
      }
      data.toDate.setHours(23, 59, 59, 0)
      data.toDate = data.toTime || data.toDate;
    } else if (data.selectTime) {
      data.selectTime.setHours(23, 59, 59, 0);
    } else {
      if (data.toTime) {
        data.toDate.setHours(data.toTime.getHours(), data.toTime.getMinutes());
      } else if (data.toDate) {
        data.toDate.setHours(23, 59, 59, 0);
      }
      if (data.fromTime) {
        data.fromDate.setHours(data.fromTime.getHours(), data.fromTime.getMinutes());
      } else if (data.fromDate) {
        data.fromDate.setHours(0, 0, 0, 0);
      }
    }
    return data;
  }

 // trims form groups from empty spaces
  static trimForm(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
        if (typeof formGroup.get(key).value === 'string' && key !== 'paymentFile' && key !== 'file') {
          formGroup.get(key).setValue(formGroup.get(key).value.trim());
        }
      }
    );
    return formGroup;
  }


  static dataURItoBlob(dataURI) {
    const byteString = window.atob(dataURI);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([int8Array], { type: 'image/jpeg' });
    return blob;
  }

  static generateSign(data) {
    const formData = new FormData();
    let md5 = '';
    Object.keys(data).sort().forEach((element, index) => {
      const value = Object.getOwnPropertyDescriptor(data, element).value;
      if (element !== 'sign') {
        md5 += element + '=' + value + '&';
      }
    });
    let req = md5;
    md5 += 'key=';
    md5 = Md5.hashStr(md5).toString();
    req += `&sign=${md5}`;

    return req;
  }

  static groupByChannel(data) {
    const groups = {
      aliGrp: [],
      weChatGrp: [],
      unionGrp: [],
      qqGrp: [],
      jdGrp: [],
      kjGrp: [],
      visaGrp: [],
      bankGrp: [],
      btcGrp: [],
      vipGrp: []
    };
    switch (data.channel) {
      case 'AliPay': case 'AliPayH5': case 'ALI': case 'AlipayQR':
        groups.aliGrp.push(data);
        break;
      case 'WeChat': case 'WeChatH5': case 'WE_CHAT': case 'WeChatPublic':
        groups.weChatGrp.push(data);
        break;
      case 'UnionPay': case 'UnionPayH5':
        groups.unionGrp.push(data);
        break;
      case 'QQWallet': case 'QQWallet':
        groups.qqGrp.push(data);
        break;
      case 'JD': case 'JDH5':
        groups.jdGrp.push(data);
        break;
      case 'KJ': case 'KJH5':
        groups.kjGrp.push(data);
        break;
      case 'VISAQR': case 'VISA':
        groups.visaGrp.push(data);
        break;
      case 'OFFLINE_BANK':
      case 'NetBank':
      case 'INTERNAL':
      case 'MERCHANT':
        groups.bankGrp.push(data);
        break;
      case 'BTC':
        groups.btcGrp.push(data);
        break;
      case 'VipChannel':
        groups.vipGrp.push(data);
        break;
    }
  }
}
